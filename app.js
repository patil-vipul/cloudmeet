const express = require('express');
const history = require('connect-history-api-fallback');
const app = express();
const port = 5555;
const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});

const io = require("socket.io")(server, {
    cors: {
        origins: ["http://localhost:8080","https://cloudmeet.vercel.app"],
    }
})

const staticFileMiddleware = express.static(__dirname + '/public');

app.use(staticFileMiddleware);
app.use(history({
    disableDotRule: true,
    verbose: true
}));
app.use(staticFileMiddleware);


var rooms = new Map()
var Room = function (meetID) {
    this.meetID = meetID;
    this.emtpy = true;
    this.addMember = (member) => {
        if (this.full) return false
        this.members.push(member)
        this.emtpy = false
        if (this.members.length == 2) {
            this.full = true
        }
        return true
    }
    this.deleteMember = (member) => {
        if (this.emtpy) return false
        var mi = this.members.findIndex(member)
        this.members.splice(mi, 1)
        this.full = false
        if (this.members.length == 0) {
            this.emtpy = true
        }
        return true
    }
    this.getOtherMember = (member) => {
        if (this.emtpy) return false
        var m = this.members[0]
        if (m == member) {
            return this.members[1]
        }
        else return m
    }
    this.getMembers = () => {
        return this.members
    }
    this.full = false;
    this.members = []
    return this
}

var roomExist = (meetID) => rooms.has(meetID)
var createRoom = (meetID) => {
    var r = new Room(meetID)
    rooms.set(meetID, r)
    return r
}
var getRoom = (meetID) => rooms.get(meetID)

io.on('connection', (socket) => {
    
    console.log("User connected : "+ socket.id)

    socket.on('join', (meetData) => {
        if (roomExist(meetData.meetID)) {
            var room = getRoom(meetData.meetID)
            if (room.full) socket.emit('roomFull')
            else {
                if (room.addMember(socket)) {
                    socket.emit('joined')
                }
            }
        } else {
            var room = createRoom(meetData.meetID)
            if (room.full) socket.emit('roomFull')
            else {
                if (room.addMember(socket)) socket.emit('created')
            }
        }

    })
    socket.on('iceCandidate', (meetData) => {
        var room = getRoom(meetData.meetID)
        var otherMember = room.getOtherMember(socket)
        otherMember.emit('iceCandidate', { candidate: meetData.candidate })
       // console.log("Candidate send from : " + socket.id)
    })
    socket.on('offer', (meetData) => {
        var room = getRoom(meetData.meetID)
        var otherMember = room.getOtherMember(socket)
        otherMember.emit('offer', { sdp: meetData.sdp, type: meetData.type })
    })
    socket.on('answer', (meetData) => {
        var room = getRoom(meetData.meetID)
        var otherMember = room.getOtherMember(socket)
        otherMember.emit('answer', { sdp: meetData.sdp, type: meetData.type })
    })
    socket.on('initiateWebRTC', (meetData) => {
        var room = getRoom(meetData.meetID)
        var otherMember = room.getOtherMember(socket)
        otherMember.emit('initiateWebRTC')
    })
})


