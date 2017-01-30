#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2016 University of Dundee.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# Author: Jean-Marie Burel <j(dot)burel(at)dundee(dot)ac(dot)uk>,
#
# Version: 1.0

import os
import setuptools.command.install
import setuptools.command.sdist
from distutils.core import Command
from setuptools import setup, find_packages


# Utility function to read the README file.
# Used for the long_description.  It's nice, because now 1) we have a top level
# README file and 2) it's easier to type in the README file than to put a raw
# string in below ...
def read(fname):
    return open(os.path.join(os.path.dirname(__file__), fname)).read()


VERSION = '0.0.7'


cmdclass = {}


class RunProd(Command):

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        if not os.path.isdir('omero_iviewer/static'):
            self.spawn(['npm', 'run', 'prod'])


cmdclass['run_prod'] = RunProd


class Sdist(setuptools.command.sdist.sdist):

    def run(self):
        if not os.path.isdir('omero_iviewer/static'):
            self.run_command('run_prod')
        setuptools.command.sdist.sdist.run(self)


cmdclass['sdist'] = Sdist


class Install(setuptools.command.install.install):

    def run(self):
        if not os.path.isdir('omero_iviewer/static'):
            self.run_command('run_prod')
        setuptools.command.install.install.run(self)


cmdclass['install'] = Install

setup(name="omero-iviewer",
      packages=find_packages(exclude=['ez_setup', 'ol3-viewer']),
      version=VERSION,
      description="A Python plugin for OMERO.web",
      long_description=read('omero_iviewer/README.rst'),
      classifiers=[
          'Development Status :: 5 - Production/Stable',
          'Environment :: Web Environment',
          'Framework :: Django',
          'Intended Audience :: End Users/Desktop',
          'Intended Audience :: Science/Research',
          'License :: OSI Approved :: GNU Affero General Public License v3.0',
          'Natural Language :: English',
          'Operating System :: OS Independent',
          'Programming Language :: JavaScript',
          'Programming Language :: Python :: 2',
          'Topic :: Internet :: WWW/HTTP',
          'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
          'Topic :: Internet :: WWW/HTTP :: WSGI',
          'Topic :: Scientific/Engineering :: Visualization',
          'Topic :: Software Development :: Libraries :: '
          'Application Frameworks',
          'Topic :: Text Processing :: Markup :: HTML'
      ],  # Get strings from
          # http://pypi.python.org/pypi?%3Aaction=list_classifiers
      author='The Open Microscopy Team',
      author_email='ome-devel@lists.openmicroscopy.org.uk',
      license='AGPL-3.0',
      url="https://github.com/ome/omero-iviewer/",
      download_url='https://github.com/ome/omero-iviewer/tarball/%s' % VERSION,  # NOQA
      keywords=['OMERO.web', 'plugin'],
      include_package_data=True,
      zip_safe=False,
      cmdclass=cmdclass,
      )