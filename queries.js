const Pool = require('pg').Pool
const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  password: 'Awesomesauces',
  database: 'healthy_eating',
  port: 5432,
})

const getUsers = (request, response) => {
  pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getUserById = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

function doesUserExist(email, name) {

	var doesExist = false;
	pool.query('SELECT true FROM users WHERE name = $1 AND email = $2', [name, email], (error, results) => {
	    if (error) {
	      throw error
	    } else {
	    	doesExist = results.rows[0]['bool'];
	    	console.log(doesExist);
	    }
	   
  	})


  	return doesExist;
}


const createUser = (request, response) => {
	const email = request.body.email
	const id = request.body.id
	const token = request.body.token
	var doesExist = false;
  	(async () => {
		await pool.query('SELECT true FROM users WHERE email = $1 AND id = $2', [email, id], (error, results) => {
	    if (error) {
	      response.status(200).send({status: 'error'})
	      throw error
	    } else {
	    	doesExist = results.rows.length > 0;
	    }

	    var addQuery = 'INSERT INTO users (email, id, token) VALUES ($1, $2, $3) RETURNING token';
	    var updateQuery = 'UPDATE users SET token = $3 WHERE email = $1 AND id = $2 RETURNING token';
	  	if (!doesExist) {
	  		pool.query(
			addQuery, 
			[email, id, token], (error, results) => {
					if (error) {
						response.status(200).send({status: 'error'})
						throw error
					}
					response.status(201).send({message: `User added with token ` + results.rows[0].token})
		   
	  		})
	  	} else {
	  		pool.query(
			updateQuery, 
			[email, id, token], (error, results) => {
					if (error) {
						response.status(200).send({status: 'error'})
						throw error
					}
					response.status(201).send({message: `User updated with token ` + results.rows[0].token})
	  		})
	  	}
	   
  	})
	})()

}

const getPreferences = (request, response) => {
	const token = request.body.token
	console.log("get preferences called with token " + token)
	pool.query(
		'SELECT vegan, gluten_free, scd, nuts, lactose FROM users WHERE token = $1',
		[token],
		(error, results) => {
			if (error) {
				console.log("error")
				response.send({status: "error", vegan: false, gluten_free: false, scd: false,
					nuts: false, lactose: false})
				
			} else if (results.rows.length == 0) {
				console.log("results.rows.length is " + results.rows.length)
				response.send({status: "error", vegan: false, gluten_free: false, scd: false,
					nuts: false, lactose: false})
			} else {
				response.status(201).send({status: "ok", vegan: results.rows[0].vegan, gluten_free: results.rows[0].gluten_free,
					scd: results.rows[0].scd, nuts: results.rows[0].nuts, lactose: results.rows[0].lactose})
			}
		})

}

const updatePreferences = (request, response) => {
	console.log("update preferences called")
	const vegan = request.body.vegan
	console.log("vegan", vegan)
	const gluten_free = request.body.gluten_free
	console.log("gluten_free", gluten_free)
	const scd = request.body.scd
	console.log("scd", scd)
	const nuts = request.body.nuts
	console.log("nuts", nuts)
	const lactose = request.body.lactose
	console.log("lactose", lactose)
	const token = request.body.token
	console.log("token", token)
	const filtersList = request.body.filtersList
	console.log("filtersList", filtersList)
	pool.query(
		'UPDATE users SET vegan = $1, gluten_free = $2, scd = $3, nuts = $4, lactose = $5 WHERE token = $6',
		[vegan, gluten_free, scd, nuts, lactose, token],
		(error, results) => {
			if (error) {
				response.status(404).send({status: "error"})
			} else {
				console.log(results.rows)
				response.status(200).send({status: "ok"})
			}
		})

}

const updateUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, email } = request.body

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
      if (error) {
      	response.status(200).send({status: "error"})
        throw error
      }
      response.status(200).send(`User modified with ID: ${id}`)
    }
  )
}

const getRestaurants = (request, response) => {
	console.log("get restaurants called")
	const latitude = request.body.latitude
	const longitude = request.body.longitude
	const token = request.body.token
	var filter = request.body.filter
	if (filter == null || filter == '') {
		filter = '!superrandom'
	} else {
		filter = filter.replace(/ /g, "&");
		console.log(filter)
	}

	var results_list = new Array();
	if (!latitude || !longitude || !token) {
		 response.status(200).send({status: "error", restaurant_list: results_list})
	}
	console.log(token)
	const query_restaurants = 
			"select a.* from (select r.restaurant_id" + "\n"
            + "               ,r.restaurant_name" + "\n"
            + "               ,r.latitude" + "\n"
            + "               ,r.longitude" + "\n"
            + "               ,r.website" + "\n"
            + "               ,r.address" + "\n"
            + "               ,distance(r.latitude, r.longitude, $1, $2) distance_km" + "\n"
            + "from (select distinct r.restaurant_id" + "\n"
            + "               ,r.restaurant_name" + "\n"
            + "               ,r.latitude" + "\n"
            + "               ,r.longitude" + "\n"
            + "               ,r.website" + "\n"
            + "               ,r.address" + "\n"
            + "from restaurants as r" + "\n"
            + "    ,restaurant_items as ri" + "\n"
            + "	   ,users as u" + "\n"
            + "where r.restaurant_id = ri.restaurant_id" + "\n"
            // + "and ri.item_name LIKE $4" + "\n"
            + "and to_tsvector(ri.item_name) @@ to_tsquery($4)" + "\n"
            + "and  u.token=$3" + "\n"
            + "and   r.active_flag = true" + "\n"
            + "and   ri.active_flag = true" + "\n"
            + "and  (u.gluten_free=false OR (u.gluten_free=true and u.gluten_free=ri.gluten_free))" + "\n"
            + "and  (u.vegan=false OR (u.vegan=true and u.vegan=ri.vegan))" + "\n"
            + "and  (u.scd=false OR (u.scd=true and u.scd=ri.scd))" + "\n"
            + "and  (u.nuts=false OR (u.nuts=true and u.nuts=ri.nuts))" + "\n"
            + "and  (u.lactose=false OR (u.lactose=true and u.lactose=ri.lactose))" + "\n"
            + "and  r.latitude is not null and r.longitude is not null" + "\n"
            + ") as r" + "\n"
            // + "and distance_km <= 600" + "\n"
            + "order by distance_km) as a" + "\n"
            + "where distance_km <= 600"
            + "limit 20";
    const query_restaurant_items = 
    		"select distinct ri.restaurant_id" + "\n"
            + "               ,ri.item_name" + "\n"
            + "               ,ri.gluten_free" + "\n"
            + "               ,ri.vegan" + "\n"
            + "               ,ri.scd" + "\n"
            + "               ,ri.nuts" + "\n"
            + "               ,ri.lactose" + "\n"
            + "from restaurants as r" + "\n"
            + "    ,restaurant_items as ri" + "\n"
            + "    ,users as u" + "\n"
            + "where r.restaurant_id = ri.restaurant_id" + "\n"
            // + "and ri.item_name LIKE $3" + "\n"
            + "and to_tsvector(ri.item_name) @@ to_tsquery($3)" + "\n"
            + "and  u.token=$1" + "\n"
            + "and  r.restaurant_id=$2" + "\n"
            + "and   r.active_flag = true" + "\n"
            + "and   ri.active_flag = true" + "\n"
            + "and  (u.gluten_free=false OR (u.gluten_free=true and u.gluten_free=ri.gluten_free))" + "\n"
            + "and  (u.vegan=false OR (u.vegan=true and u.vegan=ri.vegan))" + "\n"
            + "and  (u.scd=false OR (u.scd=true and u.scd=ri.scd))" + "\n"
            + "and  (u.nuts=false OR (u.nuts=true and u.nuts=ri.nuts))" + "\n"
            + "and  (u.lactose=false OR (u.lactose=true and u.lactose=ri.lactose))" + "\n"
            + "limit 5";
   
    
    var restaurant_id;
    var randomVar = null;

    (async() => {
    	let restaurant_list = await getRestaurantList(latitude, longitude, token, filter, query_restaurants);
    	if (restaurant_list.length == 0) {
    		console.log("returning sad")
    		response.status(200).send({status: "error", restaurant_list: new Array()})
    	} else {
    		for (var x = 0; x < restaurant_list.length; x++) {
		    	var o = {}
		    	o['name'] = restaurant_list[x].restaurant_name
		    	o['latitude'] = parseFloat(restaurant_list[x].latitude)
		    	o['longitude'] = parseFloat(restaurant_list[x].longitude)
		    	o['website'] = restaurant_list[x].website
		    	o['address'] = restaurant_list[x].address
		    	let restaurant_items = await getRestaurantItems(token, restaurant_list[x].restaurant_id, filter, query_restaurant_items);
		    	o['menu_items'] = restaurant_items
		    	results_list[x] = o
	    	}
	    	response.status(200).send({status: "ok", restaurant_list: results_list})
    	}
		


    })()
	

	 function getRestaurantItems(token, restaurant_id, filter, query_restaurant_items) {
	 	var menu_items = new Array();
	 	return new Promise(function(resolve, reject) {
  			// do a thing, possibly async, then…
			pool.query(query_restaurant_items, [token, restaurant_id, filter], (error, results) => {
				if (error) {
				  resolve(menu_items)
			      // reject(Error(error))
			    } else {
			    	for (var x = 0; x < results.rows.length; x++) {
			    		var o = {}
			    		o['item_name'] = results.rows[x].item_name
			    		o['gluten_free'] = results.rows[x].gluten_free
			    		o['vegan'] = results.rows[x].vegan
			    		o['scd'] = results.rows[x].scd
			    		o['nuts'] = results.rows[x].nuts
			    		o['lactose'] = results.rows[x].lactose
			    		menu_items.push(o)
			    	}
			    	resolve(menu_items)
			    }
				
			})
		})
	 }
	 
	 function getRestaurantList(latitude, longitude, token, filter, query_restaurants) {
    	var restaurant_list;
    	return new Promise(function(resolve, reject) {
			pool.query(query_restaurants, [latitude, longitude, token, filter], (error, results) => {
			    if (error) {
			    	resolve(new Array())
			    } else {
			    	restaurant_list = results.rows
					resolve(restaurant_list)
			    }
			    
			})
		})
		
    }	
	
s
}

const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`User deleted with ID: ${id}`)
  })
}
module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPreferences,
  updatePreferences,
  getRestaurants,
}
