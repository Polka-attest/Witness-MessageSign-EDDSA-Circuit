
import assert from "assert";
import {
    poseidon,
    computeMessageHash,
    getEDDSA,
    generateAccount,
    signMessage,
    getSignatureParameters,
    getAddressFromPubkey,
    stringToBigint,
    bigintToString,
    computeProof,
    verifyProof
} from "../lib/index";
import fs from "fs";


it("test string to bigint functions", function () {
    let myString = "helloworld";
    const bigintStr = stringToBigint(myString);
    const converted = bigintToString(bigintStr);
    assert.equal(converted, myString)
})


it("test eddsa message signing", async function () {

    const eddsa = await getEDDSA();

    const account = generateAccount(eddsa);

    const witnessAddr = await getAddressFromPubkey(account.pubKey);

    const msgslots = [stringToBigint("mint"), 123121212, stringToBigint("toAddress"), stringToBigint("extraParameter")]

    const origin = await poseidon([stringToBigint("origin")])
    const destination = await poseidon([stringToBigint("destination")])

    const messageHash = await computeMessageHash(msgslots, origin, destination);
    const signedMessage = signMessage(eddsa, messageHash, account.privKey);


    const signatureParameters = getSignatureParameters(eddsa, account.pubKey, signedMessage.signature)

    //When compiling the tests via `niftyzk verificationkey` the path of the zkey used is written into a file so you don't have to adjust the tests when using different zkeys
    const zkeyPath = fs.readFileSync("circuits/compiled/vk_meta.txt", "utf-8")
    const { proof, publicSignals } = await computeProof(
        {
            Ax: signatureParameters.Ax,
            Ay: signatureParameters.Ay,
            S: signatureParameters.S,
            R8x: signatureParameters.R8x,
            R8y: signatureParameters.R8y,
            publicInputs: {
                msgslots,
                origin,
                destination,
                witnessAddr

            },
            snarkArtifacts: {
                wasmFilePath: "circuits/compiled/circuit_js/circuit.wasm",
                zkeyFilePath: zkeyPath,
            }
        })
    const verificationKeyFile = fs.readFileSync("circuits/compiled/verification_key.json", "utf-8");
    const verificationKey = JSON.parse(verificationKeyFile);
    const result = await verifyProof({ verificationKey, proof, publicSignals })
    assert.equal(result, true)

    //Write the tested proof, publicSignals and verificationKey to a file. This will be used for generating tests for the cosmwasm verifier contracts.
    fs.writeFileSync("./circuits/compiled/test_proof.json", JSON.stringify({ proof, publicSignals, verificationKey }))
})
