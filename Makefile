release:
	docker create --name artifact $$(docker build -qt vx-labs/mqtt-dashboard .)
	docker cp artifact:dist/ ./dist
	docker rm artifact
