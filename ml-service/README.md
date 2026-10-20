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

## Run both services locally with Compose

The root `compose.yaml` builds separate Node and ML images. Compose sets `ML_SERVICE_URL=http://ml-service:8000` inside the backend container. The name `ml-service` works there because both containers share the Compose network; it does not resolve from your host or from Render.

On this Linux setup, use the installed standalone `docker-compose` command. Other installations may provide the equivalent `docker compose` command. Docker Engine and its command-line tool are enough to run and inspect containers. Docker Desktop offers a graphical view, but Docker Desktop for Linux uses a separate Docker context, so images built in the current Engine may not appear in its window until you switch contexts or rebuild them there.

```bash
test -f backend/.env || cp backend/.env.example backend/.env
# Edit backend/.env: provide MongoDB, JWT, Cloudinary, and frontend values.
docker-compose -f compose.yaml up -d --build
docker-compose -f compose.yaml ps
curl --retry 30 --retry-delay 2 --retry-connrefused -fsS http://127.0.0.1:8000/ready
curl -L -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5000/api-docs
docker-compose -f compose.yaml logs --tail=30 backend
docker-compose -f compose.yaml exec -T backend node -e 'fetch(process.env.ML_SERVICE_URL + "/ready").then(r => r.json()).then(x => console.log(x.ok, Object.keys(x.models).length))'
docker-compose -f compose.yaml down
```

`-f compose.yaml` selects this project's recipe; `up -d --build` builds both images and starts the containers in the background. `ps` shows the two running containers and their port mappings. The ML readiness request should return `"ok":true` with five loaded models. The API docs request follows the backend's redirect and should print `200` once MongoDB has connected; it may take a minute on first startup. `logs --tail=30 backend` shows recent backend startup messages. The `exec -T backend node -e ...` check should print `true 5`, proving the backend can reach the ML container by service name. `down` stops and removes the Compose containers and network. Host port 5000 serves the Node API; host port 8000 serves the ML API for local checks. Both host ports bind to `127.0.0.1` only.

To inspect the containers at any time, use `docker ps`, `docker image ls`, `docker-compose -f compose.yaml logs -f ml-service`, or `docker stats --no-stream`. `docker ps` lists running containers, `docker image ls` lists built images, `logs -f` follows live logs, and `stats` reports resource use. Press Ctrl+C to leave the live log view without stopping a container.

The backend still needs MongoDB and Cloudinary. If MongoDB runs on your host, set `MONGODB_URI=mongodb://host.docker.internal:27017/j26-se-307` in `backend/.env` for Compose; if you use Atlas, keep its connection string. `host.docker.internal` is mapped to the Docker host in `compose.yaml`. A container's own `localhost` never means another container or the host.

For a backend process started directly on your laptop, `ML_SERVICE_URL=http://127.0.0.1:8000` in `backend/.env` is correct. In Compose, `compose.yaml` overrides that value inside the backend container with `http://ml-service:8000`; you do not need to rewrite the local `.env` for that case. On Render, set `ML_SERVICE_URL` in the backend service's Render Environment page to the ML private service's internal address. Keep the remaining backend secrets in `.env` locally and in Render environment settings for deployment.

The backend has its own `Dockerfile` because Compose runs it as a separate Node container, with Node dependencies and port 5000. Its `.dockerignore` keeps local `.env` secrets, `node_modules`, tests, logs, and uploads out of the build context and image. The ML image does not contain the backend; each service can be rebuilt or deployed independently.

## Ports, settings, and memory

| Setting | Local value | Purpose |
| --- | --- | --- |
| ML `PORT` | `8000` | Port Uvicorn listens on inside the container; it binds `0.0.0.0`. |
| Backend `PORT` | `5000` | Port Express listens on inside the backend container. |
| Backend `ML_SERVICE_URL` | `http://ml-service:8000` in Compose | Internal base URL used by the Node pipeline; no trailing `/predict`. For a non-container local backend, use `http://127.0.0.1:8000`. |
| Backend `MONGODB_URI`, `JWT_SECRET` | From `backend/.env` | Required for the backend to start. |
| Backend `CLOUDINARY_*`, `FRONTEND_ORIGIN`, `GOOGLE_CLIENT_ID` | From `backend/.env` | Image storage, browser access, and optional Google sign-in. |

No model-path environment variable is needed: the verified files live at `/app/saved_models`. The local container used about **598 MiB** after five sequential synthetic predictions. Plan for at least **2 GiB of RAM** and test a **4 GiB instance** first if the service will receive simultaneous requests. Real request concurrency can raise peak memory; use `docker stats` or Render metrics to choose the final instance size. The backend stores results and calls the same five routes as before.

## Share and deploy to Render

The current backend is already on Render. Keep it as a separate web service. Deploy the ML image as a **private service** in the **same Render workspace and region** as the backend, then point the backend to the ML service's internal address. A Render private service needs a paid compute instance; an existing free web service can still send requests to it. Compose is for local development; Render does not run this Compose network for the existing backend.

1. Build and test the ML image locally, then tag it with a version that you will keep. For a Docker Hub repository, replace `yourdockerhubuser` with your account name:

   First create a repository under your account on Docker Hub and select **Private** before uploading the image. The example below calls it `j26-ml-service`; use your chosen repository name consistently. The image includes all five research checkpoints. Only people or services with pull access to the private repository can retrieve it.

   ```bash
   docker build --platform linux/amd64 -t j26-ml-service:pp1 ./ml-service
   docker tag j26-ml-service:pp1 yourdockerhubuser/j26-ml-service:pp1-20261020
   docker login
   docker push yourdockerhubuser/j26-ml-service:pp1-20261020
   ```

   `--platform linux/amd64` targets Render's required architecture; `tag` gives the same image a registry name; `login` authenticates; `push` uploads it. A successful push ends with a digest such as `sha256:...`. Keep the repository private if your checkpoint sharing terms require it. These push commands are instructions only; no image is published by this project setup.

2. In Render, choose **New > Private Service > Existing Image** and enter the full image name. If private, add a registry credential with pull access. Set `PORT=8000` and choose an instance with enough memory. Render private services use a TCP health check; this server does not open its port until all five models load, and startup fails if any checkpoint is unavailable. The `/ready` endpoint provides details from inside the Render network.
3. In that ML service's **Connect > Internal** view, copy its internal hostname and port. Set `ML_SERVICE_URL=http://<internal-hostname>:8000` in the existing Render backend web service's environment. Use the exact address Render shows, including its actual port. Commit and push the updated backend code to the branch Render deploys, then redeploy the backend with the new environment value. Git-backed services with auto-deploy enabled redeploy after a push.
4. Submit a screening through the existing frontend. The backend still returns the same analysis response shape. Check the stored model results for `caries_intraoral` and `caries_xray` when both image types are uploaded.

You **do not specifically need Docker Hub**. Render can pull prebuilt images from Docker Hub, GitHub Container Registry, and other supported registries. This project uses a registry because its `.keras` files are ignored by Git: a Render build from the repository would not receive the weights. Render can instead build from a Git Dockerfile if you later adopt a controlled way to include or download all five weights during its build. Do not put `backend/.env` or registry tokens in an image or Git.

When models or code change, rebuild and push a **new version tag**, update the Render ML service to that tag, verify `/ready`, and then keep the backend's internal URL. Image-backed Render services do not auto-deploy when you push a new image tag.

For teammates who only need local use, share repository access plus the five checkpoint files, or give them pull access to the private image. They can then run `docker pull yourdockerhubuser/j26-ml-service:pp1-20261020` followed by `docker run ...`.

For an offline handoff, `docker save -o j26-ml-service-pp1.tar j26-ml-service:pp1` writes the image to a large archive. On the other machine, `docker load -i j26-ml-service-pp1.tar` restores it and reports `Loaded image: j26-ml-service:pp1`.
