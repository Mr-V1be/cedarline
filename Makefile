# Local demo stand (see README): `make stand`, `make status`, `make stop`.
.PHONY: stand stop status

stand:
	@sh tools/stand/stand.sh

stop:
	@sh tools/stand/stop.sh

status:
	@sh tools/stand/status.sh
