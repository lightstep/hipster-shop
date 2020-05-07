.PHONY: run delete setup
run:
	skaffold run --default-repo=gcr.io/$(GCP_PROJECT_ID)

delete:
	skaffold delete --default-repo=gcr.io/$(GCP_PROJECT_ID)

setup: 
	@./setup.sh
