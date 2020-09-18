.PHONY: run setup clean
run:
	skaffold run --default-repo=gcr.io/$(GCP_PROJECT_ID)

setup: 
	@./setup.sh

clean:
	skaffold delete
	kubectl delete secrets lightstep-credentials
