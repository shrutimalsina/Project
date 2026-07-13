import os
from flask import Flask, render_template, request
from dotenv import load_dotenv
import folium
from peewee import *
import datetime
from playhouse.shortcuts import model_to_dict


from .data import user, hobbies, exp, edu, travel

load_dotenv()
app = Flask(__name__)

mydb = MySQLDatabase(
    os.getenv('MYSQL_DATABASE'),
    user=os.getenv('MYSQL_USER'),
    password=os.getenv('MYSQL_PASSWORD'),
    host=os.getenv('MYSQL_HOST'),
    port=3306
)

print(mydb)

class TimelinePost(Model):
    name = CharField()
    email = CharField()
    content = TextField()
    created_at = DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = mydb

mydb.connect()
mydb.create_tables([TimelinePost])


LINKS = [
    {"name": "About", "endpoint": "about", "tagline": "About Me", "section": "about"},
    {"name": "Work", "endpoint": "work", "tagline": "Work Experience", "section": "work"},
    {"name": "Hobbies", "endpoint": "hobby", "tagline": "My Hobbies", "section": "hobbies"},
    {"name": "Travel", "endpoint": "travel_page", "tagline": "My Travels", "section": "travel"},
    {"name": "Timeline", "endpoint": "timeline", "tagline": "Timeline", "section": "timeline"},
]

CONTACT = [
    {"label": "Contact", "href": "mailto:shrutimalsina@gmail.com"},
    {"label": "GitHub", "href": "https://github.com/shrutimalsina"},
    {"label": "LinkedIn", "href": "https://linkedin.com"},
]

def build_travel_map():
    travel_map = folium.Map(location=[20, 0], zoom_start=2)

    for place in travel["visited"]:
        folium.Marker(
            location=[place["lat"], place["lon"]],
            popup=f"{place['name']} (Visited - {place['year']})",
            icon=folium.Icon(color='green', icon='ok-sign')
        ).add_to(travel_map)

    for place in travel["wishlist"]:
        folium.Marker(
            location=[place["lat"], place["lon"]],
            popup=f"{place['name']} (Wishlist)",
            icon=folium.Icon(color='lightgreen', icon='star')
        ).add_to(travel_map)

    return travel_map._repr_html_()


@app.route('/')
def index():
    gallery_photos = [
        {"src": hobby["image"], "alt": hobby["altTxt"], "caption": hobby["name"]}
        for hobby in hobbies[:5]
    ]
    return render_template(
        'index.html',
        title="Home",
        user=user,
        hobbies=hobbies,
        exp=exp,
        edu=edu,
        travel=travel,
        map_html=build_travel_map(),
        gallery_photos=gallery_photos,
    )

@app.route('/hobbies')
def hobby():
    return render_template('hobbies.html', title = "My Hobbies", hobbies = hobbies)

@app.route('/about')
def about():
    return render_template('about.html', title="About Me", user = user, edu = edu)

@app.route('/work')
def work():
    return render_template('work.html', title="Work Experience", exp = exp)

@app.route('/travel')
def travel_page():
    return render_template('travel.html', title="Travel", map_html=build_travel_map(), travel=travel)

@app.context_processor
def nav():
    return{"links": LINKS, "contact": CONTACT, "url": os.getenv("URL"), "user": user}


@app.route('/api/timeline_post', methods=['POST'])
def post_time_line_post():
    name = request.form['name']
    email = request.form['email']
    content = request.form['content']
    timeline_post = TimelinePost.create(name=name, email=email, content=content)

    return model_to_dict(timeline_post)

@app.route('/api/timeline_post', methods=['GET'])
def get_time_line_post():
    return {
        'timeline_posts': [
            model_to_dict(p)
            for p in TimelinePost.select().order_by(TimelinePost.created_at.desc())
        ]
    }

@app.route('/timeline')
def timeline():
    return render_template('timeline.html', title="Timeline")
    
