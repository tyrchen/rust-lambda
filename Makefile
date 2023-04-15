test:
	@cargo nextest run

deploy:
	@cd infra && pulumi up

build-lambda:
	@cd api && cargo lambda build --release --arm64 --output-format zip && cp ../target/lambda/api/bootstrap.zip ../infra/lambda/lambda-api.zip


release:
	@cargo release tag --execute
	@git cliff -o CHANGELOG.md
	@git commit -a -m "Update CHANGELOG.md" || true
	@git push origin master
	@cargo release push --execute

.PHONY: test deploy release build-lambda
