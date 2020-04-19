// Type definitions for bsv 0.30
// Project: https://github.com/moneybutton/bsv
// Forked From: https://github.com/bitpay/bitcore-lib
// Definitions by: Lautaro Dragan <https://github.com/lautarodragan>
// Definitions extended by: David Case <https://github.com/shruggr>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

// TypeScript Version: 2.2

/// <reference types="node" />

declare module 'bsv' {

    export namespace crypto {
        class BN { }

        namespace ECDSA {
            function sign(message: Buffer, key: PrivateKey): Signature;
            function verify(hashbuf: Buffer, sig: Signature, pubkey: PublicKey, endian?: 'little'): boolean;
        }

        namespace Hash {
            function sha1(buffer: Buffer): Buffer;
            function sha256(buffer: Buffer): Buffer;
            function sha256sha256(buffer: Buffer): Buffer;
            function sha256ripemd160(buffer: Buffer): Buffer;
            function sha512(buffer: Buffer): Buffer;
            function ripemd160(buffer: Buffer): Buffer;

            function sha256hmac(data: Buffer, key: Buffer): Buffer;
            function sha512hmac(data: Buffer, key: Buffer): Buffer;
        }

        namespace Random {
            function getRandomBuffer(size: number): Buffer;
        }

        namespace Point { }

        class Signature {
            static fromDER(sig: Buffer): Signature;
            static fromString(data: string): Signature;
            SIGHASH_ALL: number;
            toString(): string;
        }
    }

    export namespace Transaction {
        class UnspentOutput {
            static fromObject(o: object): UnspentOutput;

            readonly address: Address;
            readonly txId: string;
            readonly outputIndex: number;
            readonly script: Script;
            readonly satoshis: number;
            spentTxId: string | null;

            constructor(data: object);

            inspect(): string;
            toObject(): this;
            toString(): string;
        }

        class Output {
            readonly script: Script;
            readonly satoshis: number;
            readonly satoshisBN: crypto.BN;
            spentTxId: string | null;
            constructor(data: object);

            setScript(script: Script | string | Buffer): this;
            inspect(): string;
            toObject(): object;
        }

        class Input {
            readonly prevTxId: Buffer;
            readonly outputIndex: number;
            readonly sequenceNumber: number;
            readonly script: Script;
            output?: Output;
            isValidSignature(tx: Transaction, sig: any): boolean;
        }
    }

    export class Transaction {
        inputs: Transaction.Input[];
        outputs: Transaction.Output[];
        readonly id: string;
        readonly hash: string;
        readonly inputAmount: number;
        readonly outputAmount: number;
        nid: string;

        constructor(serialized?: any);

        from(utxos: Transaction.UnspentOutput | Transaction.UnspentOutput[]): this;
        to(address: Address[] | Address | string, amount: number): this;
        change(address: Address | string): this;
        fee(amount: number): this;
        feePerKb(amount: number): this;
        sign(privateKey: PrivateKey | string): this;
        applySignature(sig: crypto.Signature): this;
        addInput(input: Transaction.Input): this;
        addOutput(output: Transaction.Output): this;
        addData(value: Buffer | string): this;
        lockUntilDate(time: Date | number): this;
        lockUntilBlockHeight(height: number): this;

        hasWitnesses(): boolean;
        getFee(): number;
        getChangeOutput(): Transaction.Output | null;
        getLockTime(): Date | number;

        verify(): string | boolean;
        isCoinbase(): boolean;

        enableRBF(): this;
        isRBF(): boolean;

        inspect(): string;
        serialize(): string;

        toObject(): any;
        toBuffer(): Buffer;

        verify(): boolean | string;
        isFullySigned(): boolean;
    }

    export class ECIES {
        constructor(opts?: any, algorithm?: string);
        
        privateKey(privateKey: PrivateKey): ECIES;
        publicKey(publicKey: PublicKey): ECIES;
        encrypt(message: string | Buffer): Buffer;
        decrypt(encbuf: Buffer): Buffer;
    }
    export class Block {
        hash: string;
        height: number;
        transactions: Transaction[];
        header: {
            time: number;
            prevHash: string;
        };

        constructor(data: Buffer | object);
    }

    export class PrivateKey {
        constructor(key?: string, network?: Networks.Network);
        
        readonly publicKey: PublicKey;
        readonly compressed: boolean;
        readonly network: Networks.Network;
        
        toAddress(): Address;
        toPublicKey(): PublicKey;
        toString(): string;
        toObject(): object;
        toJSON(): object;
        toWIF(): string;
        toHex(): string;
        toBigNumber(): any; //BN;
        toBuffer(): Buffer;
        inspect(): string;

        static fromString(str: string): PrivateKey;
        static fromWIF(str: string): PrivateKey;
        static fromRandom(netowrk?: string): PrivateKey;
        static fromBuffer(buf: Buffer, network: string | Networks.Network): PrivateKey;
        static fromHex(hex: string, network: string | Networks.Network): PrivateKey;
        static getValidationError(data: string): any | null;
        static isValid(data: string): boolean;
    }

    export class PublicKey {
        constructor(source: string, extra?: object);
        
        //readonly point: Point;
        readonly compressed: boolean;
        readonly network: Networks.Network;

        toDER(): Buffer;
        toObject(): object;
        toBuffer(): Buffer;
        toAddress(network?: string | Networks.Network): Address;
        toString(): string;
        toHex(): string;
        inspect(): string;

        static fromPrivateKey(privateKey: PrivateKey): PublicKey;
        static fromBuffer(buf: Buffer, strict: boolean): PublicKey;
        static fromDER(buf: Buffer, strict: boolean): PublicKey;
        //static fromPoint(point: Point, compressed: boolean): PublicKey;
        //static fromX(odd: boolean, x: Point): PublicKey;
        static fromString(str: string): PublicKey;
        static fromHex(hex: string): PublicKey;
        static getValidationError(data: string): any | null;
        static isValid(data: string): boolean;
    }

    export class Message {
        constructor(message: string | Buffer);

        readonly messageBuffer: Buffer;

        sign(privateKey: PrivateKey): string;
        verify(address: string | Address, signature: string): boolean;
        toObject(): object;
        toJSON(): string;
        toString(): string;
        inspect(): string;

        static sign(message: string | Buffer, privateKey: PrivateKey): string;
        static verify(message: string | Buffer, address: string | Address, signature: string): boolean;
        static MAGIC_BYTES: Buffer;
        static magicHash(): string;
        static fromString(str: string): Message;
        static fromJSON(json: string): Message;
        static fromObject(obj: object): Message;
    }

    export class Mnemonic {
        constructor(data: string | Array<string>, wordList?: Array<string>);

        readonly wordList: Array<string>;
        readonly phrase: string;

        toSeed(passphrase?: string): Buffer;
        toHDPrivateKey(passphrase: string, network: string | number): HDPrivateKey;
        toString(): string;
        inspect(): string;

        static fromRandom(wordlist?: Array<string>): Mnemonic;
        static fromString(mnemonic: String, wordList?: Array<string>): Mnemonic;
        static isValid(mnemonic: String, wordList?: Array<string>): boolean;
        static fromSeed(seed: Buffer, wordlist: Array<string>): Mnemonic
    }

    export class HDPrivateKey {
        constructor(data?: string | Buffer | object);

        readonly hdPublicKey: HDPublicKey;
        
        readonly xprivkey: Buffer;
        readonly xpubkey: Buffer;
        readonly network: Networks.Network;
        readonly depth: number;
        readonly privateKey: PrivateKey;
        readonly publicKey: PublicKey;
        readonly fingerPrint: Buffer;

        derive(arg: string | number, hardened?: boolean): HDPrivateKey;
        deriveChild(arg: string | number, hardened?: boolean): HDPrivateKey;
        deriveNonCompliantChild(arg: string | number, hardened?: boolean): HDPrivateKey;

        toString(): string;
        toObject(): object;
        toJSON(): object;
        toBuffer(): Buffer;
        toHex(): string;
        inspect(): string;

        static fromRandom(): HDPrivateKey;
        static fromString(str: string): HDPrivateKey;
        static fromObject(obj: object): HDPrivateKey;
        static fromSeed(hexa: string | Buffer, network: string | Networks.Network): HDPrivateKey;
        static fromBuffer(buf: Buffer): HDPrivateKey;
        static fromHex(hex: string): HDPrivateKey;
        static isValidPath(arg: string | number, hardened: boolean): boolean;
        static isValidSerialized(data: string | Buffer, network?: string | Networks.Network): boolean;
        static getSerializedError(data: string | Buffer, network?: string | Networks.Network): any | null;
    }

    export class HDPublicKey {
        constructor(arg: string | Buffer | object);

        readonly xpubkey: Buffer;
        readonly network: Networks.Network;
        readonly depth: number;
        readonly publicKey: PublicKey;
        readonly fingerPrint: Buffer;

        derive(arg: string | number, hardened?: boolean): HDPublicKey;
        deriveChild(arg: string | number, hardened?: boolean): HDPublicKey;

        toString(): string;
        toObject(): object;
        toJSON(): object;
        toBuffer(): Buffer;
        toHex(): string;
        inspect(): string;

        static fromString(str: string): HDPublicKey;
        static fromObject(obj: object): HDPublicKey;
        static fromBuffer(buf: Buffer): HDPublicKey;
        static fromHex(hex:  string): HDPublicKey;

        static fromHDPrivateKey(hdPrivateKey: HDPrivateKey): HDPublicKey;
        static isValidPath(arg: string | number): boolean;
        static isValidSerialized(data: string | Buffer, network?: string | Networks.Network): boolean;
        static getSerializedError(data: string | Buffer, network?: string | Networks.Network): any | null;

    }

    export namespace Script {
        const types: {
            DATA_OUT: string;
        };
        function buildMultisigOut(publicKeys: PublicKey[], threshold: number, opts: object): Script;
        function buildWitnessMultisigOutFromScript(script: Script): Script;
        function buildMultisigIn(pubkeys: PublicKey[], threshold: number, signatures: Buffer[], opts: object): Script;
        function buildP2SHMultisigIn(pubkeys: PublicKey[], threshold: number, signatures: Buffer[], opts: object): Script;
        function buildPublicKeyHashOut(address: Address): Script;
        function buildPublicKeyOut(pubkey: PublicKey): Script;
        function buildDataOut(data: string | Buffer, encoding?: string): Script;
        function buildScriptHashOut(script: Script): Script;
        function buildPublicKeyIn(signature: crypto.Signature | Buffer, sigtype: number): Script;
        function buildPublicKeyHashIn(publicKey: PublicKey, signature: crypto.Signature | Buffer, sigtype: number): Script;

        function fromAddress(address: string | Address): Script;

        function empty(): Script;
        namespace Interpreter {
            const SCRIPT_ENABLE_SIGHASH_FORKID: any;
        }

        function Interpreter(): {
            verify: (
                inputScript: Script, 
                outputScript: Script, 
                txn: Transaction,
                nin: Number,
                flags: any,
                satoshisBN: crypto.BN
            ) => boolean
        }
    }

    export class Script {
        constructor(data: string | object);

        set(obj: object): this;

        toBuffer(): Buffer;
        toASM(): string;
        toString(): string;
        toHex(): string;

        isPublicKeyHashOut(): boolean;
        isPublicKeyHashIn(): boolean;

        getPublicKey(): Buffer;
        getPublicKeyHash(): Buffer;

        isPublicKeyOut(): boolean;
        isPublicKeyIn(): boolean;

        isScriptHashOut(): boolean;
        isWitnessScriptHashOut(): boolean;
        isWitnessPublicKeyHashOut(): boolean;
        isWitnessProgram(): boolean;
        isScriptHashIn(): boolean;
        isMultisigOut(): boolean;
        isMultisigIn(): boolean;
        isDataOut(): boolean;
        isSafeDataOut(): boolean;

        getData(): Buffer;
        isPushOnly(): boolean;

        classify(): string;
        classifyInput(): string;
        classifyOutput(): string;

        isStandard(): boolean;

        prepend(obj: any): this;
        add(obj: any): this;

        hasCodeseparators(): boolean;
        removeCodeseparators(): this;

        equals(script: Script): boolean;

        getAddressInfo(): Address | boolean;
        findAndDelete(script: Script): this;
        checkMinimalPush(i: number): boolean;
        getSignatureOperationsCount(accurate: boolean): number;

        toAddress(network?: string): Address;
    }

    export interface Util {
        readonly buffer: {
            reverse(a: any): any;
        };
    }

    export namespace Networks {
        interface Network {
            readonly name: string;
            readonly alias: string;
        }

        const livenet: Network;
        const mainnet: Network;
        const testnet: Network;

        function add(data: any): Network;
        function remove(network: Network): void;
        function get(args: string | number | Network, keys: string | string[]): Network;
    }

    export class Address {
        readonly hashBuffer: Buffer;
        readonly network: Networks.Network;
        readonly type: string;

        constructor(data: Buffer | Uint8Array | string | object, network?: Networks.Network | string, type?: string);
    }

    export class Unit {
        static fromBTC(amount: number): Unit;
        static fromMilis(amount: number): Unit;
        static fromBits(amount: number): Unit;
        static fromSatoshis(amount: number): Unit;

        constructor(amount: number, unitPreference: string);

        toBTC(): number;
        toMilis(): number;
        toBits(): number;
        toSatoshis(): number;
    }
}