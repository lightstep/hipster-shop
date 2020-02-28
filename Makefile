.PHONY: run setup
run:
	skaffold run --default-repo=gcr.io/lightstep-hipster-shop
setup: 
ifdef access-token
	@./setup.sh $(access-token)
else
	@echo "missing access token. try make setup access-token=<your access token>"
endif
