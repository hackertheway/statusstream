#!/usr/bin/env python

FACEBOOK_APP_KEY = "07212cca83bc76ad41c808651b88a7e3"
FACEBOOK_APP_ID = "132789103436560"

import os
import facebook
import urllib
from django.utils import simplejson
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template


class MainHandler(webapp.RequestHandler):
    def get(self):
        args = dict(
            facebook_app_id = FACEBOOK_APP_ID,
            facebook_app_key = FACEBOOK_APP_KEY
            )
                            
        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write(template.render(path, args))

def main():
    application = webapp.WSGIApplication([('/', MainHandler)],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
