import { Collection, ObjectId } from "mongodb";
import { APIPhone, RestaurantModel, APITime, APICity, APIWeather, APICity2 } from "./types.ts";
import { GraphQLError } from "graphql";

type Context = {
    RestaurantCollection : Collection<RestaurantModel>;
}

export const resolvers = {
    Restaurant:{

        id:(parent:RestaurantModel):string => {
            return parent._id!.toString();
        },

        time:async (parent:RestaurantModel):Promise<string> => {
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY) throw new GraphQLError("Api key needed");
            const timezone = parent.timezone;
            const url = `https://api.api-ninjas.com/v1/worldtime?timezone=${timezone}`;
            const data = await fetch(url,
                {
                    headers:{
                        "X-Api-Key":API_KEY
                    }
                }
            );
            if(data.status!== 200) throw new GraphQLError("Api ninja error");
            const response:APITime = await data.json();

            return response.hour + ":" + response.minute;
        },

        temp:async(parent:RestaurantModel):Promise<number> => {
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY) throw new GraphQLError("Api key needed");
            const city = parent.city;
            const cityUrl = `https://api.api-ninjas.com/v1/city?name=${city}}`;
            const cityData = await fetch(cityUrl,
                {
                    headers:{
                        "X-Api-Key":API_KEY
                    }
                }
            );
            if(cityData.status!== 200) throw new GraphQLError("Api ninja error");
            const cityResponse:APICity2[] = await cityData.json();
            const latitude = cityResponse[0].latitude;
            const longitude = cityResponse[0].longitude;

            const weatherUrl = `https://api.api-ninjas.com/v1/weather?lat=${cityResponse[0].latitude}&lon=${cityResponse[0].longitude}`;
            const weatherData = await fetch(weatherUrl,
                {
                    headers:{
                        "X-Api-Key":API_KEY
                    }
                }
            );
            if(weatherData.status!== 200) throw new GraphQLError("Api ninja error");
            const weatherResponse:APIWeather = await weatherData.json();
            return weatherResponse.temp;
        },

        restaurantAddress:async(parent:RestaurantModel):Promise<string> => {
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY) throw new GraphQLError("Api key needed");
            const city = parent.city;
            const cityUrl = `https://api.api-ninjas.com/v1/city?name=${city}}`;
            const cityData = await fetch(cityUrl,
                {
                    headers:{
                        "X-Api-Key":API_KEY
                    }
                }
            );
            if(cityData.status!== 200) throw new GraphQLError("Api ninja error");
            const response:APICity[] = await cityData.json();
            const restaurantAddress = parent.address + ", " + parent.name + ", " + response[0].country;
            return restaurantAddress;
        }
    },

    Query:{
        getRestaurant:async(_:unknown, args:{id:string},ctx:Context): Promise<RestaurantModel|null> => {
            const restaurant = await ctx.RestaurantCollection.findOne({_id:new ObjectId(args.id)})
            return restaurant;
        },

        getRestaurants:async(_:unknown, args:{city:string},ctx:Context): Promise<RestaurantModel[]> => {
            const {city} = args;
            const restaurants = await ctx.RestaurantCollection.find({city}).toArray();
            return restaurants;
        }
    },

    Mutation:{
        addRestaurant:async(_:unknown, args:{name:string, address:string, city:string, phone:string},ctx:Context):Promise<RestaurantModel> => {
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY) throw new GraphQLError("Api key needed");

            const {name, address, city, phone} = args;

            const phoneExist = await ctx.RestaurantCollection.countDocuments({phone});
            if(phoneExist>=1) throw new GraphQLError("Phone already exists");

            const url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`;
            const data = await fetch(url,
                {
                    headers:{
                        "X-Api-Key":API_KEY
                    }
                }
            );
            if(data.status !== 200) throw new GraphQLError("Api ninja error");
            const response:APIPhone = await data.json();
            if(!response.is_valid) throw new GraphQLError ("Phone not valid");

            const timezone = response.timezones[0];

            const {insertedId} = await ctx.RestaurantCollection.insertOne({
                name,
                address,
                city,
                phone,
                timezone,
            })

            return {
                _id:insertedId,
                name,
                address,
                city,
                phone,
                timezone,
            }
            


        },

        deleteRestaurant:async(_:unknown, args:{id:string},ctx:Context):Promise<boolean> => {
            const {deletedCount} = await ctx.RestaurantCollection.deleteOne({_id: new ObjectId(args.id)});
            return deletedCount === 1;
        }

    }
}