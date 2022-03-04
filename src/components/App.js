import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import SocialNetwork from '../abis/SocialNetwork.json'
import Navbar from './Navbar';
import Main from './Main';

class App extends Component {

  async componentWillMount(){
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3(){
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData(){
    const web3 = window.web3
    //load account
    const accounts = await web3.eth.getAccounts()
    console.log(accounts)
    this.setState({ account: accounts[0] })
    //Network ID for address
    const networkId = await web3.eth.net.getId()
    const networkData = SocialNetwork.networks[networkId]
    if(networkData){
      //load the smart contract once gotten address
      const socialNetwork = web3.eth.Contract(SocialNetwork.abi, networkData.address)
      this.setState({ socialNetwork})
      //get postcount from .sol
      const postCount = await socialNetwork.methods.postCount().call()
      this.setState({ postCount })
      //load posts
      for( var i = 1; i <= postCount; i++){
        const post = await socialNetwork.methods.posts(i).call()
        this.setState({
          //creates new array and adds posts to the array
          posts : [...this.state.posts, post]
        })
      }
      //sort posts. show highest tipped posts first
      this.setState({
        posts: this.state.posts.sort((a,b) => b.tipAmount - a.tipAmount)
      })
      this.setState({loading: false})
    } else{
      window.alert('SocialNetwork contract not deployed on detected network.')
    }

  }

  createPost(content){
    this.setState({ loading: true })
    this.state.socialNetwork.methods.createPost(content).send({ from: this.state.account})
     //change loading to false once transaction done
    .once('receipt', (receipt) =>{
      this.setState({ loading: false})
    })
  }

  tipPost(id, tipAmount){
    this.setState({loading: true})
    this.state.socialNetwork.methods.tipPost(id).send({ from: this.state.account, value: tipAmount})
    //change loading to false once transaction done
    .once('receipt', (receipt) =>{
      this.setState({ loading: false})
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      socialNetwork: null,
      postCount: 0,
      posts:[],
      loading: true
    }

    this.createPost = this.createPost.bind(this)
    this.tipPost = this.tipPost.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account = {this.state.account}/>

        <h1>Hello</h1>

        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              posts={this.state.posts}
              createPost={this.createPost}
              tipPost={this.tipPost}
            />
            //shows that page is loading ^
        }
      </div>
    );
  }
}

export default App;
