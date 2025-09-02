import inquirer from 'inquirer';
import fetch from 'node-fetch';
import fs from 'fs'
import path from 'path';
import figlet from 'figlet'
import chalk from 'chalk'


// fn

// import { getEvetData } from './functions/getEventData';
// import { getStaticticRace } from './functions/getStatistic';

//


const getEvetData = async (eventCode: string) => {

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


const getStaticticRace = async (eventId: string, raceId: string, gender: string) => {
  try {

    const responce = await fetch(`https://results.russiarunning.com/api/results/individual/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        eventId: eventId,
        raceId: raceId,
        page: { skip: 0, take: 100 },
        filter: {
            genderNominationName: gender
        },
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


const getStatisticEvent = async (eventCode: string) => {
  try {

    const responce = await fetch(`https://results.russiarunning.com/api/results/statistics/get?EventCode=${eventCode}&Language=ru`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!responce.ok) {
      console.error(responce)
      throw new Error(
        `Ошибка получения статистики по эвенту: ${responce.status}`
      )

    }


    const data = await responce.json() as any
    return data
    
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      throw new Error(
        `Ошибка получения статистики по эвенту: ${error.message}`
      )
    }
    
  }
}


// type

type EventType = {
  id: string,
  code: string,
  title: string
  place: string
  distance: { name: string; id: string }[]
}





const question_one = {
    type: 'input' as any,
    name: 'eventCode' as any,
    message: 'Введите код события: ' as any
}

const question_two = {
    type: 'list' as any,
    name: 'distance' as any,
    message: 'Выберити дистанцию для статистики: ' as any,
    choices: [] as any[]
  
}

const question_three = {
    type: 'list' as any,
    name: 'gender' as any,
    message: 'Выберити пол для статистики: ' as any,
    choices: ['Мужчины', 'Женщины'] as any
}

const question_four = {
    type: 'confirm' as any,
    name: 'getReuslts' as any,
    message: 'Получить результаты?' as any,
    default: true as any
}



const init = async () => {

  try {

    console.log(chalk.bold.green('### Russia Running Data ###'))
    
    const answers = await inquirer.prompt([
      question_one
    ])

    const {eventCode} = answers

    // 

    const pathToFolder = path.join(process.cwd(), eventCode)

    if (!fs.existsSync(pathToFolder)) {
      fs.promises.mkdir(pathToFolder)
    }

    //

    console.log('Получение данных события...');

    const event = await getEvetData(eventCode) as EventType

    if (!event[1] || event[1].length === 0) {
      console.error('Ошибка: Нет данных для дистанций!');
      return;
    }

    console.log(`Данные события ${eventCode} получены`)


    const getEvent = await getStatisticEvent(eventCode)

    const dataStatistic = {
      numberOfMale: getEvent.numberOfMaleParticipants,
      numberOfFemale: getEvent.numberOfFemaleParticipants,
      numberOfStartedMaleParticipants: getEvent.numberOfStartedMaleParticipants,
      numberOfStartedFemaleParticipants: getEvent.numberOfStartedFemaleParticipants,
      numberOfFinishedMaleParticipants: getEvent.numberOfFinishedMaleParticipants,
      numberOfFinishedFemaleParticipants: getEvent.numberOfFinishedFemaleParticipants,
      
    }


    await fs.promises.writeFile(pathToFolder + `/event_statistic.json`, JSON.stringify([dataStatistic], null, 2))
    console.log(chalk.green(`Файл с данными статистики по мероприятию создан ${new Date().getTime().toLocaleString()}`))



    const choiceDistance = event[1].map((item: any) => item.name) as string[]

    if (!event) {
      console.error('Ошибка: Нет данных для дистанций!');
      return;
    }

    question_two.choices = choiceDistance

    console.log('Задаем второй вопрос')

    const updatedAnswers = await inquirer.prompt([question_two, question_three, question_four]);

    const {distance, gender} = updatedAnswers

    const selectedDistance = event[1].find((item: any) => {
      if (item.name === distance) {
        return item
      }
    })



    await fs.promises.writeFile(pathToFolder + `/event.json`, JSON.stringify([event[0]], null, 2))
    console.log(chalk.green(`Файл с данными по мероприятию создан ${new Date().getTime().toLocaleString()}`))




    const getRaceStatisticData = async () => {
      try {
        
        const data = await getStatisticEvent(eventCode) as any

        const raceStatistic = data.raceStatistics.map((item: any) => {
          return {
            raceName: item.name,
            femalesAvgPace: item.femalesAvgPace,
            femalesAvgSpeed: item.femalesAvgSpeed,
            femalesAvgTimeResult: item.femalesAvgTimeResult,
            malesAvgPace: item.malesAvgPace,
            malesAvgSpeed: item.malesAvgSpeed,
            malesAvgTimeResult: item.malesAvgTimeResult,
          }
        })


        await fs.promises.writeFile(pathToFolder + `/distance_statistic.json`, JSON.stringify(raceStatistic, null, 2))
        console.log(chalk.green(`Файл с данными статистики по дистанциям создан ${new Date().getTime().toLocaleString()}`))

      } catch (error) {
        console.error(error)
        
      }
    }


    await getRaceStatisticData()
    console.log(chalk.green(`Файл с данными по дистанциям создан ${new Date().getTime().toLocaleString()}`))

    setTimeout(async () => {
      getRaceStatisticData()
      console.log(chalk.green(`Данные по статистике дистанций обновлены ${new Date().getTime().toLocaleString()}`))
    })



    const getStatisticData = async () => {
      const getStatistic = await getStaticticRace(event[0].id as string, selectedDistance.id as string, gender as string) as any;

      const individualStatistic = getStatistic.results.filter((item: any) => item.genderNominationName === gender)
        .map((item: any) => ({
          name: item.fullName,
          number: item.number,
          age: item.age,
          city: item.city,
          time: item.individualResult,
          speed: item.speed,
        }));

      // Сохраняем статистику в файл
      await fs.promises.writeFile(pathToFolder + `/statistic_${gender}_${distance}.json`, JSON.stringify(individualStatistic, null, 2));
    }


    await getStatisticData()
    console.log(chalk.green(`Файл с данными по статистике создан ${new Date().toLocaleString()}`))



    setInterval(async () => {
      getStatisticData()
      console.log(chalk.green(`Данные по индивидуальному зачету обновлены ${new Date().toLocaleString()}`))
    }, 20000);


  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      console.error(`Ошибка при выполнении: ${error.message}`);
      throw new Error(
        `Ошибка при выполнении: ${error.message}`,
      )
    }
    console.error('Ошибка при выполнении:', error);
  }

}

init().catch((err) => {
  console.log(`Ошибка запуска ${err}`)
})



















