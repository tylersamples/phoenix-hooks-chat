import React, { useCallback, useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'

import {
  useChannel,
  usePresence,
  useSocket,
  SocketStates,
  ChannelStates
} from 'phoenix-hooks'

// Friendly enum to string names
const socketStatus = {
  [SocketStates.UNINSTANTIATED]: "Uninstantiated",
  [SocketStates.CONNECTING]: "Connecting",
  [SocketStates.OPEN]: "Open",
  [SocketStates.CLOSING]: "Closing",
  [SocketStates.CLOSED]: "Closed",
}

/**
 * Primary use function for connecting to a Phoenix Socket, joining a channel, and using presence via the channel.
 *
 * @param roomId
 * @param channelOps
 */
function useChat(roomId, channelOps = {}) {
  const { socket, socketConnect, socketState, socketDisconnect } = useSocket(`ws://localhost:4000/socket`)
  const { channel, channelState, pushChannelEvent, handleChannelEvent } = useChannel(`room:${roomId}`, {socket: socket, params: channelOps})
  const { handlePresenceSync } = usePresence(channel)

  return {
    socketConnect,
    socketDisconnect,
    socketState,
    channelState,
    pushChannelEvent,
    handleChannelEvent,
    handlePresenceSync
  }
}

/**
 * Our top level entry component into our application
 */
function ChatApp() {
  return (
    <div className="flex flex-col mx-auto container py-10 px-3 h-screen">
      <ChatWindow roomId={"123"} />
    </div>
  )
}

function ChatWindow({roomId}) {
  const {
    socketState,
    socketDisconnect,
    socketConnect,
    channelState,
    pushChannelEvent,
    handleChannelEvent,
    handlePresenceSync
  } = useChat(roomId)

  return (
    <>
      <div className="flex px-5">
        <div className={"flex space-x-4"}>
          <button className="text-gray-600 hover:text-red-600 disabled:line-through" disabled={socketState !== SocketStates.OPEN} onClick={() => socketDisconnect()}>Disconnect</button>
          <button className="text-gray-600 hover:text-green-600 disabled:line-through" disabled={socketState === SocketStates.OPEN} onClick={() => socketConnect()}>Connect</button>
        </div>
        <span className="ml-auto text-gray-600">{socketStatus[socketState]}</span>
      </div>

      <div className={`relative flex flex-grow shadow border-t border-white bg-white ${channelState === ChannelStates.JOINED ? "border-blue-400": "border-red-400 "}`}>
        <div className="flex flex-col w-full mt-auto">
          <ChatHistory handleChannelEvent={handleChannelEvent} />
          <div className="px-5 w-full flex  mt-auto h-14">
            <Username pushChannelEvent={pushChannelEvent} />
            <SendMessage pushChannelEvent={pushChannelEvent}/>
          </div>
        </div>
        <UsersList handlePresenceSync={handlePresenceSync} />
      </div>
    </>
  )
}

/**
 * Component for changing our username.
 *
 * @param pushChannelEvent
 */
function Username({pushChannelEvent}) {
  const [username, setUsername] = useState("Guest")

  const handleChangeUsername = (e) => {
    if (newMessage !== '') {
      pushChannelEvent('change:username', {username: e.target.value})
      setUsername(e.target.value)
    }
  }

  return (
    <div className="flex border border-r-0 border-b-0 px-5 items-center w-24">
      <input className="outline-none" type='text' placeholder={username} value={username} onChange={handleChangeUsername}/>
    </div>
  )
}

/**
 * Component for seeing our chat history.
 *
 * @param handleChannelEvent
 */
function ChatHistory({handleChannelEvent}) {
  const [messages, setMessages] = useState([])

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  });

  useEffect(() => {
    handleChannelEvent('message:new', resp => {
      setMessages(previous => [...previous, {...resp}])
    })
  }, [handleChannelEvent])

  return (
    <div className="flex flex-col flex-grow px-5 py-3 overflow-y-auto space-y-1">
      {messages.map(({username, message}, id) => {
        return <div className={"flex items-center"} key={id}>
          <div className={"border border-solid px-5 w-24"}>{username}: </div>
          <span className="px-5">{message}</span>
        </div>
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}

/**
 * Component inputting and sending our messages.
 *
 * @param handleChannelEvent
 */
function SendMessage({pushChannelEvent, socketState}) {
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage =
    useCallback(() => {
      if (newMessage !== '') {
        pushChannelEvent('message:add', {message: newMessage})
        setNewMessage('')
      }
    }, [pushChannelEvent, newMessage, setNewMessage])

  return (
    <div className="inline-flex w-full">
      <div className="flex border border-r-0 border-b-0 px-5 items-center w-full">
        <input className="outline-none w-full" type='text' placeholder={'New Message'} value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter")
            handleSendMessage()
        }} />
      </div>
      <button className="flex items-center border border-b-0 bg-blue-50 px-5" onClick={() => handleSendMessage()}> Send </button>
    </div>
  )
}

/**
 * Component for seeing the list of users.
 *
 * @param handlePresenceSync
 */
function UsersList({handlePresenceSync}) {
  const [users, setUsers] = useState([])
  useEffect(() => {
    handlePresenceSync(usersSync => {
      setUsers(usersSync.sort((u1, u2) => {
        return u1.metas[0].online_at > u2.metas[0].online_at
      }))
    })
  }, [setUsers, handlePresenceSync])

  return (
    <div className="ml-auto h-full border-l border-gray-200 border-solid px-3 w-48">
      <div className="py-2 border-b border-dashed">
        Online Users
      </div>
      <div>
        {users.map(({metas: [{username, color}]}, id) =>
          <div className="flex items-center" key={id}>
            <div className="h-3 w-4 border" style={{"backgroundColor": color}}>&nbsp;</div>
            <span className="pl-2">{username}</span>
          </div>
        )}
      </div>
    </div>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <ChatApp />
  </React.StrictMode>,
  document.getElementById('root'),
);
