# this is intended to be run from within an ambaviz containing sim output directory like
# $ make -f $FLIT_STALKER/serve_ambaviz_data.mk
# so you'll need to set FLIT_STALKER to the location of your local install
# (this script needs to know where flit stalker is installed)

.PHONY: all start_server

# Check if flit_stalker is set
ifndef FLIT_STALKER
$(error FLIT_STALKER is not set)
endif

Check if SOC_REPO_VERIF is set
ifndef SOC_REPO_VERIF
$(error SOC_REPO_VERIF is not set - enter workspace?)
endif

# we need the output dir, expected and actual to see a diff
all: flit_stalker flit_stalker/ambaviz_messages.json flit_stalker/server start_server

clean: 
	rm -rf flit_stalker

# need output dir to hold temp files
flit_stalker:
	mkdir -p flit_stalker
	cp -r $(FLIT_STALKER)/* flit_stalker

# extract ALL json messages from ambaviz
flit_stalker/ambaviz_messages.json: dump_0.avdb $(FLIT_STALKER)/etc/ambaviz2json.gvy
	with-eda $(SOC_REPO_VERIF)/common/ambaviz/triton-gvy.sh -f dump_0.avdb -g $(FLIT_STALKER)/etc/ambaviz2json.gvy > $@

 flit_stalker/server: flit_stalker/server.c
	gcc $^ -o $@

start_server: flit_stalker/server
	cd flit_stalker && ./server

# Rule to create an unzipped version of a file from a gzipped version only if the unzipped version doesn't already exist
%.avdb: %.avdb.gz
	@if [ ! -f $@ ]; then \
		echo "Unzipping $< to create $@"; \
		gunzip -k $<; \
	else \
	echo "$@ already exists, skipping unzipping"; \
	fi


