import React, { Fragment } from 'react'
import * as R from 'ramda'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import AppBar from 'material-ui/AppBar'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card'
import FlatButton from 'material-ui/FlatButton'
import Dialog from 'material-ui/Dialog'
import {cyan200} from 'material-ui/styles/colors'
import TextField from 'material-ui/TextField'

import './App.css'

class App extends React.Component {
  constructor (props) {
    super(props)
    const url_testnet = 'https://testnet.nebulas.io'
    const url = 'http://localhost:8685'
    const dAppAddress = 'n1iUnJoreX3KvKAnHeFVZqh66rR4b9iuLWn'

    this.nebulas = window.require('nebulas')
    this.neb = new this.nebulas.Neb()
    this.neb.setRequest(new this.nebulas.HttpRequest(url))
    this.dAppAddress = dAppAddress

    const NebPay = window.require('nebpay')
    this.nebPay = new NebPay()


    this.state = {
      openSendMessageDialog: false,
      openSendCommentDialog: false,
      messageWillBeSent: '',
      commentWillBeSent: '',
      messages: [
      ]
    }
  }

  componentDidMount () {
    this.neb.api.call(
      this.nebulas.Account.NewAccount().getAddressString(),
      this.dAppAddress,
      '0',
      '1',
      '1000000',
      '2000000',
      {
        function: 'getMessages',
        args: JSON.stringify([0, 10])
      }
    ).then(response => {
      let {messages} = JSON.parse(response.result)
      if (R.isNil(messages)) {

      } else {
        messages = R.map((message) => R.assoc('comments', [], message))(R.reject(R.isNil)(messages))
        this.setState({messages})
        Promise.all(R.map(message => {
          return this.neb.api.call(
            this.nebulas.Account.NewAccount().getAddressString(),
            this.dAppAddress,
            '0',
            '1',
            '1000000',
            '2000000',
            {
              function: 'getComments',
              args: JSON.stringify([message.messageId])
            }
          )
        })(messages)).then((responses) => {
          R.forEach((response) => {
            const {messageId, comments} = JSON.parse(response.result)

            console.info(messageId, comments)
          
            const messages = R.clone(this.state.messages)
            const message = R.find(R.propEq('messageId', messageId), this.state.messages)
            if (message) {
              message.comments = comments
              console.log(JSON.stringify(message))
              this.setState({message})
            } else {

            }
          })(responses)
        })
      }
    }).catch(error => {
      console.info(error)
    })

    // window.postMessage({
    //   target: 'contentscript',
    //   data: {
    //     to: this.dAppAddress,
    //     value: 0,
    //     contract: {
    //       function: 'getMessage',
    //       args: JSON.stringify([1])
    //     }
    //   },
    //   method: 'neb_sendTransaction'
    // }, '*')

    window.addEventListener('message', (e) => {
      // debugger
      console.info(e)
    })
  }

  componentDidUpdate (_, prevState) {
    if (prevState.openSendMessageDialog === true && this.state.openSendMessageDialog === false) {
      this.setState({
        messageWillBeSent: ''
      })
    }

    if (prevState.openSendCommentDialog === true && this.state.openSendCommentDialog === false) {
      this.setState({
        commentWillBeSent: ''
      })
    }
  }

  render () {
    const avatar = address => (window.blockies.create({
      seed: address,
      color: cyan200
    }).toDataURL())

    return (
      <MuiThemeProvider>
        <Fragment>
          <AppBar title='留言板' iconElementLeft={null} iconElementRight={<FlatButton label='添加留言' onClick={() => this.setState({openSendMessageDialog: true})} />} />
          {this.state.messages.map((message, i) => (
            <div className='container' key={i}>
              <Card>
                <CardHeader title={`#${i}`} subtitle={message.sender} avatar={avatar(message.sender)} />
                <CardText>
                  {message.content}
                </CardText>
                
                {message.comments.map((comment, j) => (
                  <div className='comment' key={j}><Card style={{
                    boxShadow: 'unset',
                    backgroundColor: cyan200
                  }}>
                  
                    <CardHeader
                     title={`#${j}`} subtitle={comment.sender} avatar={avatar(message.sender)} />
                     <CardText>
                       {comment.content}
                       </CardText>
                  </Card>
                  </div>
                ))}
                <CardActions>
                  <FlatButton primary label='添加评论' onClick={() => {
                    this.setState({openSendCommentDialog: true, commentOnMessageId: i})
                  }} />
                </CardActions>
              </Card>
            </div>
          ))}
          <Dialog
            title='添加留言'
            actions={[
              <FlatButton
                label='取消'
                onClick={() => { this.setState({openSendMessageDialog: false}) }}
              />,
              <FlatButton
                label='发布'
                primary
                onClick={() => {
                  const to = this.dAppAddress
                  const value = '0'
                  const serialNumber = this.nebPay.call(to, value, 'addMessage', JSON.stringify([this.state.messageWillBeSent]), {
                    listener: (e) => console.info(serialNumber, e)
                  })

                  this.setState({openSendMessageDialog: false})
                }}
              />
            ]}
            modal
            open={this.state.openSendMessageDialog}
          >
            <TextField
              floatingLabelText='你的留言'
              hintText='你可以回车键换行'
              multiLine
              fullWidth
              onChange={(event, value) => { this.setState({messageWillBeSent: value}) }}
            /><br />
          </Dialog>
          <Dialog
            title='添加评论'
            actions={[
              <FlatButton
                label='取消'
                onClick={() => { this.setState({openSendCommentDialog: false}) }}
              />,
              <FlatButton
                label='发布'
                primary
                onClick={() => {
                  const to = this.dAppAddress
                  const value = '0'
                  const serialNumber = this.nebPay.call(to, value, 'addComment', JSON.stringify([this.state.commentOnMessageId, this.state.commentWillBeSent]), {
                    listener: (e) => console.info(serialNumber, e)
                  })

                  this.setState({openSendCommentDialog: false})
                }}
              />
            ]}
            modal
            open={this.state.openSendCommentDialog}
          >
            <TextField
              floatingLabelText='你的评论'
              hintText='你可以回车键换行'
              multiLine
              fullWidth
              onChange={(event, value) => { this.setState({commentWillBeSent: value}) }}
            /><br />
          </Dialog>
        </Fragment>
      </MuiThemeProvider>

    )
  }
}

export default App
