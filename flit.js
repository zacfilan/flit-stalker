/**
 * A flit is a chunk of data that is sent between nodes in a network. It's size
 * and fields are defined by what is passed into the constructor
 */
class FlitField {
    /** LSB of the field
     * @type {number}
     */
    lsb; 

    /** MSB of the field
     * @type {number}
     */
    msb; 

    /**
    * The numeric value of the field
    * @type {bigint}
     */
    value;

    /**
     * The name of the field
     * @type {string}
     */
    name;

    get Field() {
        return this.name;
    }

    get Bits() {
        return `[${this.msb}:${this.lsb}]`;
    }

    get Number() {
        return `0x${this.value.toString(16)}`;
    }

    get Decoded() {
        return this.valueNames?.[this.Number] || this.Number;
    }

    /** 
     * @type {Object.<bigint, string>} some values have symbolic names */
    valueNames;

    /**
     * copy-like constructor
     * @type {FlitField} other
     */
    constructor(other) {
        this.lsb = BigInt(other.lsb);
        this.msb = BigInt(other.msb);
        this.value = other.value;
        this.valueNames = other.valueNames;
        this.name = other.name;
    }

    /* set the value of the field */
    from(value) {
        let mask = (1n << (this.msb - this.lsb + 1n)) - 1n;
        this.value = (value >> this.lsb) & mask;
    }

    toString() {
        return `${this.name}:${this.Decoded}`;
    }

}

/**
 * Can be configured with some JSON that will be used to declare the fields,
 * their locations, and enum/string value info
 */
class Flit {
    /** @type {Array<FlitField>} - Array of fields in flit */
    fields;

    _value;

    set value(to) {
        this._value = to;
        for(let field of this.fields) {
            field.from(to);
        }
    }

    /**
     * @param {Array<FlitField>} fields - Array of fields in the flitdecoder
     */
    constructor(fields = []) {
        // FIXME: build up the field objects
        this.fields = [];
        for(let field of fields) {
            this.fields.push(new FlitField(field));
        }
    }

    toString() {
        return this.fields.map(field => field.toString()).join(" ");
    }

}

export { Flit, FlitField };