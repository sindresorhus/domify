
build: tip.css index.js
	@component build

components:
	@component install

clean:
	rm -fr build components

.PHONY: clean
