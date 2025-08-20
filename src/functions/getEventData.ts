import fetch from "node-fetch"


export const getEvetData = async (eventCode: string) => {

  try {

    const responce = await fetch('https://results.russiarunning.com/api/events/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'eventCode': eventCode,
        'language': 'ru'
      })
      
    })


    if (!responce.ok) {
      throw new Error(
        `Ошибка получения данных о мероприятии: ${responce.status}`
      )
    }

    const data = await responce.json() as any


    let result: any = []


    const eventInfo = {
      id: data.id,
      code: data.code,
      title: data.title,
      place: data.place
    }

    result.push(eventInfo)


    const distanceInfo = data.races.map((item: any) => {
      if (item) {
        let distancePointObj = new Object({
          id: item.id,
          code: item.code,
          name: item.name,
        })
        return distancePointObj
      }
    })


    result.push(distanceInfo)

    return result
    
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      console.error(`Ошибка получения данных о мероприятии  ${error.message}`)
      throw new Error(
        `Ошибка получения данных о мероприятии  ${error.message}`
      )
    }

    return `Ошибка получения данных о мероприятии  ${error}`
    
  }

}