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
            public SIGHASH_ALL: number;
            public static fromDER(sig: Buffer): Signature;
            public static fromString(data: string): Signature;
            public toString(): string;
        }
    }

    export namespace Transaction {
        class UnspentOutput {
            public readonly address: Address;
            public readonly outputIndex: number;
            public readonly satoshis: number;
            public readonly script: Script;
            public spentTxId: string | null;
            public readonly txId: string;
            constructor(data: object);
            public static fromObject(o: object): UnspentOutput;
            public inspect(): string;
            public toObject(): any;
            public toString(): string;
        }

        class Output {
            public readonly satoshis: number;
            public readonly satoshisBN: crypto.BN;
            public readonly script: Script;
            public spentTxId: string | null;
            constructor(data: object);
            public inspect(): string;
            public setScript(script: Script | string | Buffer): this;
            public toObject(): any;
        }

        class Input {
            public output?: Output;
            public readonly outputIndex: number;
            public readonly prevTxId: Buffer;
            public readonly script: Script;
            public sequenceNumber: number;
            public isValidSignature(tx: Transaction, sig: any): boolean;
        }
    }

    export class Transaction {
        public readonly hash: string;
        public readonly id: string;
        public readonly inputAmount: number;
        public inputs: Transaction.Input[];
        public nid: string;
        public nLockTime: number;
        public readonly outputAmount: number;
        public outputs: Transaction.Output[];
        constructor(serialized?: any);
        public addData(value: Buffer | string): this;
        public addInput(input: Transaction.Input): this;
        public addOutput(output: Transaction.Output): this;
        public applySignature(sig: crypto.Signature): this;
        public change(address: Address | string): this;
        public enableRBF(): this;
        public fee(amount: number): this;
        public feePerKb(amount: number): this;
        public from(utxos: Transaction.UnspentOutput | Transaction.UnspentOutput[]): this;
        public getChangeOutput(): Transaction.Output | null;
        public getFee(): number;
        public getLockTime(): Date | number;
        public hasWitnesses(): boolean;
        public inspect(): string;
        public isCoinbase(): boolean;
        public isFullySigned(): boolean;
        public isRBF(): boolean;
        public lockUntilBlockHeight(height: number): this;
        public lockUntilDate(time: Date | number): this;
        public serialize(): string;
        public sign(privateKey: PrivateKey | string): this;
        public to(address: Address[] | Address | string, amount: number): this;
        public toBuffer(): Buffer;
        public toObject(): any;
        public verify(): string | boolean;
        public verify(): boolean | string;
    }

    export class ECIES {
        constructor(opts?: any, algorithm?: string);
        public decrypt(encbuf: Buffer): Buffer;
        public encrypt(message: string | Buffer): Buffer;
        public privateKey(privateKey: PrivateKey): ECIES;
        public publicKey(publicKey: PublicKey): ECIES;
    }
    export class Block {
        public hash: string;
        public header: {
            prevHash: string;
            time: number;
        };
        public height: number;
        public transactions: Transaction[];
        constructor(data: Buffer | object);
    }

    export class PrivateKey {
        public readonly compressed: boolean;
        public readonly network: Networks.Network;
        public readonly publicKey: PublicKey;
        constructor(key?: string, network?: Networks.Network);
        public static fromBuffer(buf: Buffer, network: string | Networks.Network): PrivateKey;
        public static fromHex(hex: string, network: string | Networks.Network): PrivateKey;
        public static fromRandom(netowrk?: string): PrivateKey;
        public static fromString(str: string): PrivateKey;
        public static fromWIF(str: string): PrivateKey;
        public static getValidationError(data: string): any | null;
        public static isValid(data: string): boolean;
        public inspect(): string;
        public toAddress(): Address;
        public toBigNumber(): any; //BN;
        public toBuffer(): Buffer;
        public toHex(): string;
        public toJSON(): any;
        public toObject(): any;
        public toPublicKey(): PublicKey;
        public toString(): string;
        public toWIF(): string;
    }

    export class PublicKey {
        //readonly point: Point;
        public readonly compressed: boolean;
        public readonly network: Networks.Network;
        constructor(source: string, extra?: object);
        public static fromBuffer(buf: Buffer, strict: boolean): PublicKey;
        public static fromDER(buf: Buffer, strict: boolean): PublicKey;
        public static fromHex(hex: string): PublicKey;
        public static fromPrivateKey(privateKey: PrivateKey): PublicKey;
        //static fromPoint(point: Point, compressed: boolean): PublicKey;
        //static fromX(odd: boolean, x: Point): PublicKey;
        public static fromString(str: string): PublicKey;
        public static getValidationError(data: string): any | null;
        public static isValid(data: string): boolean;
        public inspect(): string;
        public toAddress(network?: string | Networks.Network): Address;
        public toBuffer(): Buffer;
        public toDER(): Buffer;
        public toHex(): string;
        public toObject(): any;
        public toString(): string;
    }

    export class Message {
        public static MAGIC_BYTES: Buffer;
        public readonly messageBuffer: Buffer;
        constructor(message: string | Buffer);
        public static fromJSON(json: string): Message;
        public static fromObject(obj: object): Message;
        public static fromString(str: string): Message;
        public static magicHash(): string;
        public static sign(message: string | Buffer, privateKey: PrivateKey): string;
        public static verify(message: string | Buffer, address: string | Address, signature: string): boolean;
        public inspect(): string;
        public sign(privateKey: PrivateKey): string;
        public toJSON(): string;
        public toObject(): any;
        public toString(): string;
        public verify(address: string | Address, signature: string): boolean;
    }

    export class Mnemonic {
        public readonly phrase: string;
        public readonly wordList: Array<string>;
        constructor(data: string | Array<string>, wordList?: Array<string>);
        public static fromRandom(wordlist?: Array<string>): Mnemonic;
        public static fromSeed(seed: Buffer, wordlist: Array<string>): Mnemonic
        public static fromString(mnemonic: String, wordList?: Array<string>): Mnemonic;
        public static isValid(mnemonic: String, wordList?: Array<string>): boolean;
        public inspect(): string;
        public toHDPrivateKey(passphrase: string, network: string | number): HDPrivateKey;
        public toSeed(passphrase?: string): Buffer;
        public toString(): string;
    }

    export class HDPrivateKey {
        public readonly depth: number;
        public readonly fingerPrint: Buffer;
        public readonly hdPublicKey: HDPublicKey;
        public readonly network: Networks.Network;
        public readonly privateKey: PrivateKey;
        public readonly publicKey: PublicKey;
        public readonly xprivkey: Buffer;
        public readonly xpubkey: Buffer;
        constructor(data?: string | Buffer | object);
        public static fromBuffer(buf: Buffer): HDPrivateKey;
        public static fromHex(hex: string): HDPrivateKey;
        public static fromObject(obj: object): HDPrivateKey;
        public static fromRandom(): HDPrivateKey;
        public static fromSeed(hexa: string | Buffer, network: string | Networks.Network): HDPrivateKey;
        public static fromString(str: string): HDPrivateKey;
        public static getSerializedError(data: string | Buffer, network?: string | Networks.Network): any | null;
        public static isValidPath(arg: string | number, hardened: boolean): boolean;
        public static isValidSerialized(data: string | Buffer, network?: string | Networks.Network): boolean;
        public derive(arg: string | number, hardened?: boolean): HDPrivateKey;
        public deriveChild(arg: string | number, hardened?: boolean): HDPrivateKey;
        public deriveNonCompliantChild(arg: string | number, hardened?: boolean): HDPrivateKey;
        public inspect(): string;
        public toBuffer(): Buffer;
        public toHex(): string;
        public toJSON(): any;
        public toObject(): any;
        public toString(): string;
    }

    export class HDPublicKey {
        public readonly depth: number;
        public readonly fingerPrint: Buffer;
        public readonly network: Networks.Network;
        public readonly publicKey: PublicKey;
        public readonly xpubkey: Buffer;
        constructor(arg: string | Buffer | object);
        public static fromBuffer(buf: Buffer): HDPublicKey;
        public static fromHDPrivateKey(hdPrivateKey: HDPrivateKey): HDPublicKey;
        public static fromHex(hex: string): HDPublicKey;
        public static fromObject(obj: object): HDPublicKey;
        public static fromString(str: string): HDPublicKey;
        public static getSerializedError(data: string | Buffer, network?: string | Networks.Network): any | null;
        public static isValidPath(arg: string | number): boolean;
        public static isValidSerialized(data: string | Buffer, network?: string | Networks.Network): boolean;
        public derive(arg: string | number, hardened?: boolean): HDPublicKey;
        public deriveChild(arg: string | number, hardened?: boolean): HDPublicKey;
        public inspect(): string;
        public toBuffer(): Buffer;
        public toHex(): string;
        public toJSON(): any;
        public toObject(): any;
        public toString(): string;
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
        public add(obj: any): this;
        public checkMinimalPush(i: number): boolean;
        public classify(): string;
        public classifyInput(): string;
        public classifyOutput(): string;
        public equals(script: Script): boolean;
        public findAndDelete(script: Script): this;
        public getAddressInfo(): Address | boolean;
        public getData(): Buffer;
        public getPublicKey(): Buffer;
        public getPublicKeyHash(): Buffer;
        public getSignatureOperationsCount(accurate: boolean): number;
        public hasCodeseparators(): boolean;
        public isDataOut(): boolean;
        public isMultisigIn(): boolean;
        public isMultisigOut(): boolean;
        public isPublicKeyHashIn(): boolean;
        public isPublicKeyHashOut(): boolean;
        public isPublicKeyIn(): boolean;
        public isPublicKeyOut(): boolean;
        public isPushOnly(): boolean;
        public isSafeDataOut(): boolean;
        public isScriptHashIn(): boolean;
        public isScriptHashOut(): boolean;
        public isStandard(): boolean;
        public isWitnessProgram(): boolean;
        public isWitnessPublicKeyHashOut(): boolean;
        public isWitnessScriptHashOut(): boolean;
        public prepend(obj: any): this;
        public removeCodeseparators(): this;
        public set(obj: object): this;
        public toAddress(network?: string): Address;
        public toASM(): string;
        public toBuffer(): Buffer;
        public toHex(): string;
        public toString(): string;
    }

    export interface Util {
        readonly buffer: {
            reverse(a: any): any;
        };
    }

    export namespace Networks {
        interface Network {
            readonly alias: string;
            readonly name: string;
        }

        const livenet: Network;
        const mainnet: Network;
        const testnet: Network;
        function add(data: any): Network;
        function remove(network: Network): void;
        function get(args: string | number | Network, keys: string | string[]): Network;
    }

    export class Address {
        public static PayToPublicKeyHash: string;
        public static PayToScriptHash: string;
        public readonly hashBuffer: Buffer;
        public readonly network: Networks.Network;
        public readonly type: string;
        constructor(data: Buffer | Uint8Array | string | object, network?: Networks.Network | string, type?: string);
        public static createMultisig(publicKeys: PublicKey[], threshold: number, network: Networks.Network | string): Address;
        public static fromBuffer(hash: Buffer, network: Networks.Network | string): Address;
        public static fromHex(hex: string, network?: Networks.Network | string, type?: string): Address;
        public static fromObject(obj: any): Address
        public static fromPrivateKey(data: PrivateKey, network: Networks.Network | string): Address;
        public static fromPublicKey(data: PublicKey, network: Networks.Network | string): Address;
        public static fromPublicKeyHash(hash: Buffer, network: Networks.Network | string): Address;
        public static fromScript(script: Script, network: Networks.Network | string): Address;
        public static fromScriptHash(hash: Buffer, network: Networks.Network | string): Address;
        public static fromString(str: string, network?: Networks.Network | string, type?: string): Address;
        public static getValidationError(data: string, network?: Networks.Network | string, type?: string): Error | null;
        public static isValid(data: string, network?: Networks.Network | string, type?: string): boolean;
        public static payingTo(script: Script, network: Networks.Network | string): Address;
        public inspect(): string;
        public isPayToPublicKeyHash(): boolean;
        public isPayToScriptHash(): boolean;
        public toBuffer(): Buffer;
        public toHex(): string;
        public toJSON(): any;
        public toObject(): any;
        public toString(): string;
    }

    export class Unit {
        constructor(amount: number, unitPreference: string);
        public static fromBits(amount: number): Unit;
        public static fromBTC(amount: number): Unit;
        public static fromMilis(amount: number): Unit;
        public static fromSatoshis(amount: number): Unit;
        public toBits(): number;
        public toBTC(): number;
        public toMilis(): number;
        public toSatoshis(): number;
    }
}