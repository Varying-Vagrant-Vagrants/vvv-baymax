# Description:
#   A static JSON brain

fs = require 'fs'

module.exports = (robot) ->
  file = process.env.BRAIN_IMPORT_FILE || process.cwd() + '/brain-import.json'
  robot.logger.info "Looking for #{file}"
  fs.exists file, (exists) ->
  if !exists
    robot.logger.info "Brain import file (#{file}) does not exist."
    return
  robot.logger.info "Brain import file (#{file}) exists. Importing."
  json = require file
  robot.brain.mergeData json
  robot.logger.info "Brain import file (#{file}) loaded and merged?"
