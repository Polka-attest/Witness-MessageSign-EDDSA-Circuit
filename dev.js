import path from "path";
import { wasm as wasm_tester } from "circom_tester";
import fs from "fs";
import {
    poseidon,
    computeMessageHash,
    getEDDSA,
    generateAccount,
    signMessage,
    getSignatureParameters,
    getAddressFromPubkey,
    stringToBigint,
} from "./lib/index.js";

/**
 * This is hot-reload for circom circuit development.
 */

/**
 * Configure the main entry point file here
 */
const MAIN = "circuit.circom";

async function getInput() {
    const eddsa = await getEDDSA();

    const account = generateAccount(eddsa);

    const witnessAddr = await getAddressFromPubkey(account.pubKey);

    const msgslots = [stringToBigint("mint"), 123121212, stringToBigint("toAddress"), stringToBigint("extraParameter")]

    const origin = await poseidon([stringToBigint("origin")])
    const destination = await poseidon([stringToBigint("destination")])

    const messageHash = await computeMessageHash(msgslots, origin, destination);

    const signedMessage = signMessage(eddsa, messageHash, account.prvKey);

    const signatureParameters = getSignatureParameters(eddsa, account.pubKey, signedMessage.signature)

    return {
        Ax: signatureParameters.Ax,
        Ay: signatureParameters.Ay,
        S: signatureParameters.S,
        R8x: signatureParameters.R8x,
        R8y: signatureParameters.R8y,
        msgslots,
        origin,
        destination,
        witnessAddr
    }
}

let TESTING = false;

async function testCircuit(filename) {
    if (TESTING) {
        return;
    }

    if (!filename.endsWith(".circom")) {
        return;
    }

    TESTING = true;
    try {
        console.log(`Running wasm_tester`)

        const circuit = await wasm_tester(path.join(process.cwd(), "circuits", MAIN));

        const witness = await circuit.calculateWitness(await getInput(), true);

        await circuit.checkConstraints(witness);

        //Assert the output of your circuit to test it during development
        // await circuit.assertOut(witness, { out: 0 });

    } catch (err) {
        console.log(err)
    } finally {
        setTimeout(() => { TESTING = false }, 100);
    }

}


async function main() {
    await testCircuit(MAIN);
    console.log("Watching circuits for changes")
    fs.watch(path.join(process.cwd(), "circuits"), async (eventType, filename) => {
        await testCircuit(filename)
    })
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
})