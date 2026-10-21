# PP1 ML service with Docker

This is one FastAPI service and one Docker image. Its single Uvicorn worker loads five independent Keras checkpoints at startup: OLP, OSMF, ELP, intraoral caries, and X-ray caries. The Node backend calls `POST /predict/{model_key}`; the frontend continues to use the Node API and its existing result format.


The five `.keras` files total about 145 MiB on disk, so they are embedded in the ML image. The locally built image is about 1.88 GB uncompressed because it also includes TensorFlow. `verify_models.py` checks every file's size and SHA-256 hash against its metadata during the build. Keep `saved_models/<model>/model.keras`, `saved_models/<model>/metadata.json`, and `saved_models/manifest.json` together. The files are loaded from `/app/saved_models` inside the image. **The `.keras` files are ignored by Git**, so a new clone needs the five checkpoint files before it can build this image.

| API model key | Checkpoint path inside the image |
| --- | --- |
| `olp` | `/app/saved_models/olp/model.keras` |
| `osmf` | `/app/saved_models/osmf/model.keras` |
| `elp` | `/app/saved_models/leukoplakia_erythroplakia/model.keras` |
| `caries_intraoral` | `/app/saved_models/caries_intraoral/model.keras` |
| `caries_xray` | `/app/saved_models/caries_xray/model.keras` |

The pinned dependencies in `requirements.txt` use the CPU build of TensorFlow 2.21.0, matching the locally tested TensorFlow release. Docker uses Python 3.12. `uvicorn --workers 1` loads the checkpoints once per ML container. Increasing the worker count repeats the model memory use.

## Build and run the ML image locally

Run these commands from the repository root. Docker Engine must be running, and all five `.keras` files must be present.

```bash
python3 ml-service/verify_models.py
docker build -t j26-ml-service:pp1 ./ml-service
docker run -d --rm --name j26-ml-service -p 127.0.0.1:8000:8000 j26-ml-service:pp1
curl --retry 30 --retry-delay 2 --retry-connrefused -fsS http://127.0.0.1:8000/ready
docker stats --no-stream j26-ml-service
docker stop j26-ml-service
```

| Command | Arguments and expected output |
| --- | --- |
| `python3 ml-service/verify_models.py` | Checks local weights before building. Prints `Verified ...` for each of five models. |
| `docker build -t j26-ml-service:pp1 ./ml-service` | `-t` names the image; `./ml-service` is the build context. The last lines should show all five `Verified ...` messages and a successful image build. |
| `docker run -d --rm --name ... -p 127.0.0.1:8000:8000 ...` | `-d` runs in the background; `--rm` removes the stopped container; `--name` names it; `-p` maps host port 8000 to container port 8000 on local loopback. Prints a container ID. |
| `curl --retry 30 --retry-delay 2 --retry-connrefused -fsS .../ready` | Retries while models load, then returns JSON with `"ok":true` and five statuses `"loaded"`. If a model cannot load, the container exits instead of becoming ready. |
| `docker stats --no-stream ...` | Prints a one-time memory and CPU measurement. Check this during startup and predictions before sizing a Render instance. |
| `docker stop ...` | Stops the container; `--rm` then removes it. |

To inspect startup output, run `docker logs j26-ml-service`. The server should report `Uvicorn running on http://0.0.0.0:8000`. To test a model with your own JPEG image, run:

```bash
curl -fsS -X POST http://127.0.0.1:8000/predict/caries_intraoral -F 'image=@sample.jpg;type=image/jpeg'
```

Put an actual oral image named `sample.jpg` in the repository root first. The response contains `modelKey`, `modelVersion`, `status`, `inputModality`, `predictedClass`, and `classScores`. Use `/predict/caries_xray` with a dental X-ray image. These endpoints are for integration checks; the current metadata marks held-out clinical validation as pending.

## Run the ML container with the Node backend locally

The root `compose.yaml` builds and runs only the ML service. The backend runs directly with Node, so it reaches the published ML port at `http://localhost:8000`. On this Linux setup, use the installed `docker-compose` command; installations with the Compose plugin can use `docker compose` instead.

From the repository root, start the ML service:

```bash
docker-compose up -d --build --remove-orphans ml-service
docker-compose ps
curl --retry 30 --retry-delay 2 --retry-connrefused -fsS http://127.0.0.1:8000/ready
```

`up -d --build ml-service` builds the one ML image and starts its container in the background. The readiness request should return `"ok":true` with five loaded models. In a second terminal, start the backend:

```bash
cd backend
npm install
npm run dev
```

The `--remove-orphans` option removes a backend container left by the old Compose setup, freeing port 5000 for Node. Keep `ML_SERVICE_URL=http://localhost:8000` in `backend/.env`, along with its MongoDB, JWT, Cloudinary, and Google settings. The backend listens on `http://localhost:5000`. Check it from another terminal with `curl -L -sS -o /dev/null -w '%{http_code}\n' http://localhost:5000/api-docs`; a running backend should return `200`. The `ml-service` hostname is for containers on the Compose network and does not resolve from Node running on your computer.

Use `docker-compose logs -f ml-service` to follow the ML logs, `docker stats --no-stream` to check memory, and `docker-compose down` to stop the ML container. Press Ctrl+C to stop `npm run dev` separately. Docker Desktop is optional for viewing containers; Docker Engine and the command line are enough.

## Ports, settings, and memory

| Setting | Local value | Purpose |
| --- | --- | --- |
| ML `PORT` | `8000` | Port Uvicorn listens on inside the container; it binds `0.0.0.0`. |
| Backend `PORT` | `5000` | Port Express listens on when run with Node. |
| Backend `ML_SERVICE_URL` | `http://localhost:8000` locally | Base URL used by the Node pipeline; no trailing `/predict`. On Render, use the deployed ML service's reachable URL. |
| Backend `MONGODB_URI`, `JWT_SECRET` | From `backend/.env` | Required for the backend to start. |
| Backend `CLOUDINARY_*`, `FRONTEND_ORIGIN`, `GOOGLE_CLIENT_ID` | From `backend/.env` | Image storage, browser access, and optional Google sign-in. |

No model-path environment variable is needed: the verified files live at `/app/saved_models`. The local container used about **598 MiB** after five sequential synthetic predictions. Plan for at least **2 GiB of RAM** and test a **4 GiB instance** first if the service will receive simultaneous requests. Real request concurrency can raise peak memory; use `docker stats` or Render metrics to choose the final instance size. The backend stores results and calls the same five routes as before.

## Share and deploy the ML image

The backend runs as a Node web service on Render, so it does not need a backend Docker image. Deploy the ML image separately, then set `ML_SERVICE_URL` in Render's backend environment to the ML service URL. The Compose hostname `ml-service` is only for containers on the local Compose network.

1. Build and test the ML image locally, then tag it with a version that you will keep. For a Docker Hub repository, replace `yourdockerhubuser` with your account name:

   First create a repository under your account on Docker Hub and select **Private** before uploading the image. The example below calls it `j26-ml-service`; use your chosen repository name consistently. The image includes all five research checkpoints. Only people or services with pull access to the private repository can retrieve it.

   ```bash
   docker build --platform linux/amd64 -t j26-ml-service:pp1 ./ml-service
   docker tag j26-ml-service:pp1 yourdockerhubuser/j26-ml-service:pp1-20261020
   docker login
   docker push yourdockerhubuser/j26-ml-service:pp1-20261020
   ```

   `--platform linux/amd64` builds an x86-64 image; `tag` gives the same image a registry name; `login` authenticates; `push` uploads it. A successful push ends with a digest such as `sha256:...`. Keep the repository private if your checkpoint sharing terms require it. These push commands are instructions only; no image is published by this project setup.

2. Deploy that ML image to your container host, such as the Cloud Run service already used by this project. Configure its container port as `8000` and give it enough memory for the five loaded models. If the registry repository is private, the host needs credentials to pull the image. Check `/ready` after deployment.
3. Set `ML_SERVICE_URL` in the Render **Node backend** service's environment to the deployed ML service URL. Use the exact HTTPS URL if the ML service is on Cloud Run. Keep MongoDB, JWT, Google, and Cloudinary values in Render's environment settings. Restart or redeploy the backend after changing its environment.
4. Submit a screening through the existing frontend. The backend still returns the same analysis response shape. Check the stored model results for `caries_intraoral` and `caries_xray` when both image types are uploaded.

You **do not specifically need Docker Hub**. Any registry supported by the ML container host can hold this image. The `.keras` files are ignored by Git, so a remote build from a fresh checkout would need a separate way to receive all five checkpoints. Do not put `backend/.env` or registry tokens in an image or Git.

When models or code change, rebuild and push a **new version tag**, update the deployed ML service to that tag, and verify `/ready`. The Render backend can keep its `ML_SERVICE_URL` if the deployed ML service URL stays the same.

For teammates who only need local use, share repository access plus the five checkpoint files, or give them pull access to the private image. They can then run `docker pull yourdockerhubuser/j26-ml-service:pp1-20261020` followed by `docker run ...`.

For an offline handoff, `docker save -o j26-ml-service-pp1.tar j26-ml-service:pp1` writes the image to a large archive. On the other machine, `docker load -i j26-ml-service-pp1.tar` restores it and reports `Loaded image: j26-ml-service:pp1`.
