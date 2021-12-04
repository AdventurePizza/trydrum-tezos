//importing the methods of Taquito and the file with the test account data acc.json

import { TezosToolkit } from '@taquito/taquito'
import { InMemorySigner } from '@taquito/signer'
const acc = require('./acc.json')
export class token_transfer {
  // setting up the link to the testnet’s public node
  private tezos: TezosToolkit
  rpcUrl: string

  constructor(rpcUrl: string) {
    this.tezos = new TezosToolkit(rpcUrl)
    this.rpcUrl = rpcUrl

    //reading the mail, password, and the passphrase that can produce the private key
    this.tezos.setSignerProvider(InMemorySigner.fromFundraiser(acc.email, acc.password, acc.mnemonic.join(' ')))
  }

  // declaring the method transfer that has the following params:
  //
  // 1) contract: contract address;
  // 2) sender: sender address;
  // 3) receiver: recipient address;
  // 4) amount: amount of tokens to be sent.

  public transfer(contract: string, sender: string, receiver: string, amount: number) {
    this.tezos.contract
      .at(contract) //calling the contract at the address
      .then((contract) => {
        console.log(`Sending ${amount} from ${sender} to ${receiver}...`)
        //calling the entry point transfer, send the reciever/sender addresses and the amount of tokens to be sent to it.
        return contract.methods.transfer(sender, receiver, amount).send()
      })
      .then((op) => {
        console.log(`Awaiting for ${op.hash} to be confirmed...`)
        return op.confirmation(1).then(() => op.hash) //waiting for 1 network confirmation
      })
      .then((hash) => console.log(`Hash: https://granada.tzstats.com/${hash}`)) //getting the operation’s hash
      .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`))
  }
}