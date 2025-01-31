import { OptionalId } from "mongodb";

export type Restaurant = {
    id:string,
    name:string,
    address:string,
    city:string,
    phone:string,
    time:string,
}

export type RestaurantModel = OptionalId<{
    name:string,
    address:string,
    city:string,
    phone:string,
    timezone:string,
}>

export type APIPhone = {
    is_valid:boolean,
    timezones:string[]
}

export type APITime = {
    hour:string,
    minute:string
}

export type APICity = {
    country:string
}

export type APICity2 = {
    latitude:number,
    longitude:number
}

export type APIWeather = {
    temp:number
}