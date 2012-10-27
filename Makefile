
build: index.js
	@component build

components:
	@component install

clean:
	rm -fr build components

test:
	@mocha-phantomjs test/index.html

.PHONY: clean test
