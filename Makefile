
build: index.js components
	@component build --dev

components:
	@component install --dev

clean:
	rm -fr build components

test:
	@./node_modules/.bin/component-test phantom

.PHONY: build clean test
