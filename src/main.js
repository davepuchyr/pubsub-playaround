'use strict'

const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Multiplex = require('libp2p-multiplex')
const SECIO = require('libp2p-secio')
const PeerInfo = require('peer-info')
const FloodSub = require('libp2p-floodsub')
const waterfall = require('async/waterfall')
const parallel = require('async/parallel')
const series = require('async/series')


const WebRTCStar = require('libp2p-webrtc-star')
const WebSockets = require('libp2p-websockets')

const SPDY = require('libp2p-spdy')

const Railing = require('libp2p-railing')

const bootstrappers = [
  '/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd',
  '/dns4/sfo-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLju6m7xTh3DuokvT3886QRYqxAzb1kShaanJgW36yx',
  '/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3',
  '/dns4/sfo-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLnSGccFuZQJzRadHn95W2CrSFmZuTdDWP8HXaHca9z',
  '/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM',
  '/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu',
  '/dns4/nyc-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm',
  '/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64'
]

class MyBundle extends libp2p {
  constructor (peerInfo) {

    const wstar = new WebRTCStar()

    const modules = {
      transport: [
        wstar,
        new TCP(),
        new WebSockets()
      ],
      connection: {
        muxer: [
          Multiplex,
          SPDY
        ],
        crypto: [SECIO]
      },
      discovery: [
        wstar.discovery,
        new Railing(bootstrappers)
        ]
    }
    super(modules, peerInfo)
  }
}

function createNode (callback) {
  let node

  waterfall([
    (cb) => PeerInfo.create(cb),
    (peerInfo, cb) => {
      // peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
      const peerIdStr = peerInfo.id.toB58String()
      console.log(peerIdStr)
      const ma = `/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star/ipfs/${peerIdStr}`
      peerInfo.multiaddrs.add(ma)

      node = new MyBundle(peerInfo)
      node.start(cb)
    }
  ], (err) => callback(err, node))
}

parallel([
  (cb) => createNode(cb)
], (err, nodes) => {
  if (err) { throw err }

  const node1 = nodes[0]

  const fs1 = new FloodSub(node1)

  series([
    (cb) => fs1.start(cb),

    (cb) => node1.once('peer:discovery', (peer) => node1.dial(peer, cb)),

    (cb) => setTimeout(cb, 500)
  ], (err) => {
    if (err) { throw err }

    // fs1.on('news', (msg) => console.log(msg.from, msg.data.toString() ))
    fs1.subscribe('news')

    // (cb) => document.getElementById('tinput').addEventListener('input', node1.dial( document.getElementById('tinput').value, cb))
    fs1.on('news', (msg) => console.log(msg.from, msg.data.toString()))
    fs1.subscribe('news')

    setInterval(() => {
      fs1.publish('news', Buffer.from(Date.now().toString()))
    }, 1000)
  })
})
