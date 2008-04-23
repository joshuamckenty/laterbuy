#!/bin/sh -x

zip -9 -ur buylater.xpi chrome components defaults install.rdf chrome.manifest -x \*/.\* -x xptgen
