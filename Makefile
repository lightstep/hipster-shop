.PHONY: run setup
run:
	skaffold run --default-repo=gcr.io/lightstep-hipster-shop
setup: 
	./setup.sh $(access-token)
