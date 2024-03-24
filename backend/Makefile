dev:
	pipenv run uvicorn src.main:app --reload

supabase-start:
	supabase start -x inbucket,imgproxy,edge-runtime,realtime

supabase-reset:
	supabase db reset