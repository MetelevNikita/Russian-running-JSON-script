import fetch from "node-fetch"

export const getStaticticRace = async (eventId: string, raceId: string) => {
  try {

    const responce = await fetch(`https://results.russiarunning.com/api/results/individual/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        eventId: eventId,
        raceId: raceId,
        page: { skip: 0, take: 25 },
        filter: {},
        isStagesOn: true,
        language: 'ru'
      })
    })

    if (!responce.ok) {
      throw new Error(
        `Ошибка получения статистики по гонке: ${responce.status}`
      )
    }

    const data = await responce.json() as any
    return data
    


    
  } catch (error: Error | unknown) {

    if (error instanceof Error) {
      throw new Error(
        `Ошибка получения статистики по гонке: ${error.message}`
      )
    }

    return 'Ошибка получения статистики по гонке' + error
    
  }
}