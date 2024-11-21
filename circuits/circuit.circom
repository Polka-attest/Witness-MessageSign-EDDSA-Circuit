pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";


template VerifySignature(){
    // Public inputs
    // There should be 4 message slots, the messages are are hashed and then signed
    signal input msgslots[4];
    // The identifier of the origin contract is a poseidon hash
    signal input origin;

    // The identifier of the destination contract is a poseidon hash
    signal input destination;


    //The witness address is computed from the witness pubkey Ax, Ay
    signal input witnessAddr;

    //The parameters for the signature
    //The Ax and Ay parameters are the public key, Ax = pubKey[0], Ay = pubKey[1]
    signal input Ax;
    signal input Ay;
    signal input S;
    signal input R8x;
    signal input R8y;

    component eddsa = EdDSAPoseidonVerifier();
    component poseidon = Poseidon(6);
    
    poseidon.inputs[0] <== msgslots[0];
    poseidon.inputs[1] <== msgslots[1];
    poseidon.inputs[2] <== msgslots[2];
    poseidon.inputs[3] <== msgslots[3];

    // Verifies the origin and destination contract is in the signature
    poseidon.inputs[4] <== origin;
    poseidon.inputs[5] <== destination;

    log(Ax);
    log(Ay);
    log(S);
    log(R8x);
    log(R8y);
    log(poseidon.out);

    //Verify the signature on the message hash

    eddsa.enabled <== 1;
    eddsa.Ax <== Ax;
    eddsa.Ay <== Ay;
    eddsa.S <== S;
    eddsa.R8x <== R8x;
    eddsa.R8y <== R8y;
    eddsa.M <== poseidon.out;

    component witnessAddrPoseidon = Poseidon(2);
    witnessAddrPoseidon.inputs[0] <== Ax;
    witnessAddrPoseidon.inputs[1] <== Ay;

    // Verify that the public input witnessAddress is the signer
    // The witness address is poseidon hash of the pubKey
    witnessAddr === witnessAddrPoseidon.out;

}

component main {public [msgslots,origin, destination,witnessAddr]} = VerifySignature();
