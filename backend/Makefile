dev:
	pipenv run uvicorn app.main:app --reload

supabase-start:
	supabase start -x inbucket,imgproxy,edge-runtime,realtime

supabase-reset:
	supabase db reset