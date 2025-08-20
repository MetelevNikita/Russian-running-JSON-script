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


const getStaticticRace = async (eventId: string, raceId: string) => {
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



    await fs.promises.writeFile(pathToFolder + `/event.json`, JSON.stringify(event, null, 2))
    console.log(chalk.green(`Файл с данными по мероприятию создан ${new Date().getTime().toLocaleString()}`))


    const getStatisticData = async () => {
      const getStatistic = await getStaticticRace(event[0].id as string, selectedDistance.id as string) as any;

      const individualStatistic = getStatistic.results.filter((item: any) => item.genderNominationName === gender)
        .map((item: any) => ({
          name: item.fullName,
          age: item.age,
          city: item.city,
          time: item.individualResult,
          speed: item.speed,
        }));

      // Сохраняем статистику в файл
      await fs.promises.writeFile(pathToFolder + `/statistic_${gender}.json`, JSON.stringify(individualStatistic, null, 2));
    }


    await getStatisticData()
    console.log(chalk.green(`Файл с данными по статистике создан ${new Date().toLocaleString()}`))



    setInterval(async () => {
      getStatisticData()
      console.log(chalk.green(`Данные обновлкены ${new Date().toLocaleString()}`))
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



















