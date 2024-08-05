# Flit Stalker

Flit stalker is a network traffic visualizer. It tracks flits as they travel through a network. Nodes in the network are visualized as swim lanes. 
Flits are represented as arrows between swim lanes.

## JSON Input

All flit data is supplied via a single JSON file. This format (schema) is documented via the JSON Schema specification [here](doc/flit_stalker_schema.json).

## Quick Start

To use flit stalker your data must adhere to the expected data schema. The following recipe has been provided to convert Ambaviz data into this schema.

Go a SVC machine. Establish a location for flit stalker. I suggest your home directory. Clone flit stalker there.

```
cd ~
git clone https://github.com/zacfilan/flit-stalker.git
```

Enter the workspace of the sim result you are interested in, cd to the sim directory output, and set the FLIT_STALKER environment variable.

```
enter-workspace <whatever>
cd <whatever sim output>
export FLIT_STALKER=~/flit-stalker
```
From inside your simout directory (the one that contains the Ambaviz dump)

```
make -f $FLIT_STALKER/serve_ambaviz_data.mk
```

This will create a sub-directory called flit_stalker in your output sim directory. In it it will place a version of the Ambaviz db translated into JSON, and flit stalker code.
It will then start a mini http server that serves
just this directory, running flit stalker on your data. You can then point to this url from a remote browser. Once your data loads you can kill the server. Flit stalker is a single page app, it
will not require the server again once it has loaded your data.

e.g.
```
...
Server running at http://172.30.247.133:3000/
```
