.PHONY: run setup
run:
	skaffold run --default-repo=gcr.io/$(GCP_PROJECT_ID)

setup: 
	@./setup.sh
