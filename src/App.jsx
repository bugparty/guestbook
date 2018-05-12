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

    const url = 'https://testnet.nebulas.io'
    const dAppAddress = 'n1tqBZvHMo6QiqDPC6umvnAkf4sfcPcSH7A'

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
        // {
        //   id: 1,
        //   sender: '阿卜杜拉',
        //   content: '安拉胡阿克巴',
        //   comments: [
        //     {
        //       id: 2,
        //       sender: '真主',
        //       content: '请你吃猪肉'
        //     },
        //     {
        //       id: 2,
        //       sender: '真主',
        //       content: '请你吃猪肉'
        //     }
        //   ]
        // },
        // {
        //   id: 1,
        //   sender: '阿卜杜拉',
        //   content: '安拉胡阿克巴',
        //   comments: [
        //     {
        //       id: 2,
        //       sender: '真主',
        //       content: '请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉请你吃猪肉'
        //     },
        //     {
        //       id: 2,
        //       sender: '真主',
        //       content: '请你吃猪肉'
        //     }
        //   ]
        // }
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

      console.info(messages)
      if (R.isNil(messages)) {

      } else {
        messages = R.map((message) => R.assoc('comments', [], message))(R.reject(R.isNil)(messages))
        this.setState({messages})
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
                <CardHeader title={`#${i + 1}`} subtitle={message.sender} avatar={avatar(message.sender)} />
                <CardText>
                  {message.content}
                </CardText>
                {message.comments.map((comment, j) => (
                  <div className='comment' key={j}><Card style={{
                    boxShadow: 'unset',
                    backgroundColor: cyan200
                  }}>
                    <CardHeader title={comment.sender} subtitle={comment.content} />
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
                  const serialNumber = this.nebPay.call(to, value, 'addMessage', this.state.messageWillBeSent, {
                    listener: (e) => console.info(serialNumber, e)
                  })
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
          
                  // this.state.commentOnMessageId
                  console.info(`发布 ${this.state.commentOnMessageId}`)
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
