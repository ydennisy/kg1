dev:
	pipenv run uvicorn app.main:app --reload

build-docker:
	docker build -t kg1-backend .

supabase-start:
	supabase start -x inbucket,imgproxy,edge-runtime,realtime

supabase-reset:
	supabase db reset