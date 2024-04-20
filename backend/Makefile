dev:
	pipenv run uvicorn app.main:app --reload

docker-build:
	docker build -t kg1-backend .

docker-run:
	docker run -p 8080:8080 kg1-backend

docker-shell:
	docker run -it --entrypoint /bin/sh kg1-backend

supabase-start:
	supabase start -x inbucket,imgproxy,edge-runtime,realtime

supabase-reset:
	supabase db reset