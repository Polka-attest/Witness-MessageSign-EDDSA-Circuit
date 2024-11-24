# PolkaAttest - Witness sign and Verify message using EDDSA

This is a circom project that verifies an EDDSA signed message with a zero knowledge proof. 

The signed message is composed of 4 message slots, an origin and a destination

Public inputs: msgslots, origin, destiantion, witnessAddr, nonce

Private inputs: Ax, Ay, S, R8x,R8y - Used for the signature

Poseidon hashing is used.

## Assertions:

The signed message must be `hash(msgslots[0],msgslots[1],msgslots[2],msgslots[3],origin,destination,nonce);

All message hash parameters are maximum 20 bytes size.

The nonce is a random number that ensures the messages are unique each time. It can be used for nullification on both the message emitter contracts, it can serve as a message id for witnesses to track and for duplicate messages on the attestation chain and destination chain.

The origin and the destination are both poseidon hashes. The message slot contains arbitrary data, string or bigint or number.

The circuit asserts that the message was signed by the witness address by checking witnessAddress === hash(Ax,Ay)


## Message
| Field      | MaxSize      | Description |
| ------------- | ------------- | ------------- |
| msgSlot 0 | 20 bytes | The first message slot for arbitrary data |
| msgSlot 1 | 20 bytes | The second message slot for arbitrary data |
| msgSlot 2 | 20 bytes | The third message slot for arbitrary data |
| msgSlot 3 | 20 bytes | The fourth message slot for arbitrary data |
| origin | 20 bytes | The identifier of the origin, poseidon hash |
| destination | 20 bytes | The identifier of the destination, poseidon hash |
| nonce | 20 bytes | Random nonce, unique for each message |

