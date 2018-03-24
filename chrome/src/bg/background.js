chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
  console.log(req)
  if (req.source === 'popup') {
    if (req.action === 'poll') {
      sendMessageToPopup(cachedData)
    }
  }
})

let playerIds = [472528, 660271, 571875, 518468, 657225, 592178]

const mlbTVRootURL = `https://www.mlb.com/tv/g`
const URL = `https://mcmadbat.me/batterup/`
const headshotURL = `http://mlb.mlb.com/mlb/images/players/head_shot/`

// cached data
let cachedData = []

//initial 
getData()

// poll
setInterval(getData, 10000)

function getData() {
  $.ajax({
    url: URL,
    type: 'get',
    dataType: 'json',
    success: onSuccess
  })
}

function onSuccess(response) {
  let games = response.data
  let rows = []

  // clear the table body
  $('#tbody').html('')

  // proccess the response and find the relevant information for the players
  playerIds.forEach(id => {

    let game = games.find(game => game.players && game.players.map(x => x.id).includes(id))

    let row = {
      id,
      data: {
        gameStatus: null,
        order: -1,
        isPitching: false,
        isSideBatting: false,
        img: `${headshotURL}${id}.jpg`
      }
    }

    if (game) {
      row.data.mlbTVLink = `${mlbTVRootURL}${game.gamePk}`

      row.data.gameStatus = game.gameStatus.abstractGameCode

      let player = game.players.find(x => x.id === id)

      row.data.position = player.position
      row.data.name = player.name

      // treat batters and pitchers differently
      if (1 == row.data.position) {
        row.data.isPitching = game.currentAwayPitcher === id || game.currentHomePitcher === id
      }

      let homeOrder = game.homeTeam.battingOrder
      let awayOrder = game.awayTeam.battingOrder

      // home or away
      if (homeOrder.includes(id)) {
        row.data.isSideBatting = game.currentTeamAtBat === 'home'

        row.data.order =  (9 + homeOrder.indexOf(id) - homeOrder.indexOf(game.currentHomeBatter)) % 9
      } else if (awayOrder.includes(id)) {
        row.data.isSideBatting = game.currentTeamAtBat === 'away'

        row.data.order =  (9 + awayOrder.indexOf(id) - awayOrder.indexOf(game.currentHomeBatter)) % 9
      }
    } else {
      // TODO: have to populate another way
      row.data.name ='TODO'
      row.data.position = 1
    }

    rows.push(row)
  })
  cachedData = rows
  sendMessageToPopup(rows)
}

function sendMessageToPopup(data) {
  console.log('sending ')
  console.log(data)
  chrome.runtime.sendMessage({
    source: 'background',
    data: data
  })
}