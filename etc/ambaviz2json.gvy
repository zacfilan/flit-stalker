println """
{
    "timescale": "${db.timescale}",
    "messages": [
"""

/** keep track of the decoders used/required */
def flitDecoders = [:]

class FlitField {

    int lsb
    int msb
    String name
    Map<Integer, String> valueNames

    FlitField() {
        this.valueNames = [:]
    }

    // Example method to decode a value
    String decode(int value) {
        return valueNames.containsKey(value) ? valueNames[value] : value
    }
}

class FlitDecoder {

    String name
    List<FlitField> flitFields

    FlitDecoder(ambaVizDecoder) {
        this.name = ambaVizDecoder.toString()
        this.flitFields = []

        // order them descending
        def ambaVizFields = ambaVizDecoder.getFieldDecoderMap().sort { a, b ->
            ambaVizDecoder.getFieldDecoder(b.key).lsb <=>
            ambaVizDecoder.getFieldDecoder(a.key).lsb
        }

        ambaVizFields.each { fieldName, fieldD ->
            def ambaVizFieldDecoder = ambaVizDecoder.getFieldDecoder(fieldName)
            def flitField = new FlitField()
            flitField.lsb = ambaVizFieldDecoder.lsb
            flitField.msb = ambaVizFieldDecoder.msb
            flitField.name = fieldName
            this.flitFields.add(flitField)
        // as instances are processed we can add to the valueNames map for
        // decoding the flit field values
        }
    }

    /**
        // a decoder is an array of field decoders
        decoderName: [
            {
                lsb: _lsb,
                msb: _msb,
                name: _name,
                valueNames: {
                    1: 'symbolic name for 1',
                    2: 'symbolix name for 2',
                    ...
                }

            }
        ]
    */
    String toJSON() {
        def json = """
            "${this.name}": [
        """

        def first = true
        this.flitFields.each { flitField ->
            if(!first) {
                json += ",\n"
            }
            first = false

            json += """
                {
                    "name": "${flitField.name}",
                    "lsb": ${flitField.lsb},
                    "msb": ${flitField.msb}

            """
            if(!flitField.valueNames.isEmpty()) {
                json += ",\n\"valueNames\" : {\n"
                def firstValueName = true
                flitField.valueNames.each { key, value ->
                    if(!firstValueName) {
                        json += ",\n"
                    }
                    firstValueName = false
                    json += "    \"$key\": \"$value\""
                }
                json += '}\n'
            }
            json += '}'
        }
        json += "]"
        return json
    }
}

boolean first = true
db.messages.each { msg ->
    if (!first) {
        println ","
    }
    first = false

    println """
    {
        "Message": "${msg.info}",
        "Source Scope": "${msg.source}",
        "Target Scope": "${msg.target}",
        "Timestamp": ${msg.startTs},
        "endTs": ${msg.endTs},
        "id": ${msg.id}, """

    def flit = msg.sourceChannel.decodableVars[0]
    if(flit == null) {
        System.err.println("error: flit has no decodable variables!")
        System.err.println(msg.sourceChannel)
        System.exit(1)
    }

    // keep track of the decoders used
    def ambaVizFlitDecoder = flit.getDecoder()
    def ambaVizFlitDecoderName = ambaVizFlitDecoder.toString()
    def flitDecoder = flitDecoders[ambaVizFlitDecoderName]
    if(!flitDecoder) {
        flitDecoder = flitDecoders[ambaVizFlitDecoderName] = new FlitDecoder(ambaVizFlitDecoder)
    }

    // the fields are now in reverse order
    BigInteger value = new BigInteger("0")
    def fieldValue
    def fieldvals
    def lsb

    flitDecoder.flitFields.each { flitField ->
        lsb = flitField.lsb
        fieldvals = msg.getFieldValue(flitField.name).toString()

        if(fieldvals == "null") {
//           println("\"error\": \"field ${flitField.name}> = \"null\",")
           fieldvals = "0"
        }

        if (fieldvals.startsWith("0x") || fieldvals.startsWith("0X")) {
           fieldvals = fieldvals.substring(2)
           fieldValue = new BigInteger(fieldvals, 16)
        } else if (fieldvals.startsWith("x") || fieldvals.startsWith("X")) {
            fieldvals = fieldvals.substring(1)
            fieldValue = new BigInteger(fieldvals, 16)
        }
        else {
            fieldValue = new BigInteger(fieldvals, 10)
        }

        value = value.or(fieldValue.shiftLeft(lsb))
        String decodedValue = msg.getDecodedFieldValue(flitField.name)
        if(!(decodedValue ==~ /^(0x[0-9a-fA-F]+|\d+)$/)) {
            //System.err.println("$fieldvals != ${decodedValue}")
            flitField.valueNames["0x${fieldValue.toString(16)}"] = decodedValue
        }
    }

    println """
        "flit": "0x${value.toString(16)}",
        "decoder": "$ambaVizFlitDecoderName"
    }
    """
}

println '''
        ],
        "events": [
'''
boolean firstEvent = true
db.events.each { e ->
    if (!firstEvent) {
        println ","
    }
    firstEvent = false
    println "\"${e}\""
}

println '''
        ],
        "decoders" : {
'''

boolean firstFlitDecoder = true
flitDecoders.each { flitName, flitDecoder ->
    if (!firstFlitDecoder) {
        println(",")
    }
    firstFlitDecoder = false
    print flitDecoder.toJSON()
}

println '''
        }
    }
'''
