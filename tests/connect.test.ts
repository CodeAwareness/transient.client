import client from '../src/index'

let connected

client.config('clientEditor', 'centralStation')

describe('Transient client', () => {
  test('should connect', async () => {
    await new Promise((resolve, reject) => {
      client.onConnect((conf: any) => {
        console.log('TEST: connected', conf)
        connected = true
        resolve(true)
      })
    })
    expect(connected).toBeTruthy()
  })
})
