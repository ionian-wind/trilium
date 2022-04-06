const path = require('path');

const axios = require('axios');

const attributeService = require('../../services/attributes');
const noteService = require('../../services/notes');
const dateNoteService = require('../../services/date_notes');
const dateUtils = require('../../services/date_utils');
const imageService = require('../../services/image');
const utils = require('../../services/utils');

const Attribute = require('../../becca/entities/attribute');

const cls = require('../../services/cls');

const processContent = async (images, note, content) => {
  let rewrittenContent = content;

  if (images) {
    for (const { src, imageId } of images) {
      const filename = path.basename(src);

      const response = await axios.get(src, { responseType: 'arraybuffer' })
        .then(response => Buffer.from(response.data, 'binary'))
        .catch(error => {
          console.log(error);
          return null;
        });

      if (response) {
        const {note: imageNote, url} = imageService.saveImage(
            note.noteId,
            response,
            filename,
            true
        );

        new Attribute({
          noteId: imageNote.noteId,
          type: 'label',
          name: 'archived'
        }).save(); // so that these image notes don't show up in search / autocomplete

        new Attribute({
          noteId: note.noteId,
          type: 'relation',
          name: 'imageLink',
          value: imageNote.noteId
        }).save();

        console.log(`Replacing ${imageId} with ${url}`);

        rewrittenContent = utils.replaceAll(rewrittenContent, imageId, url);
      } else {
        rewrittenContent = utils.replaceAll(rewrittenContent, imageId, '/images/icon-black.png');
      }
    }
  }

  return rewrittenContent;
}

function getClipperInboxNote() {
  return attributeService.getNoteWithLabel('clipperInbox') || dateNoteService.getTodayNote();
}

module.exports = async (data) => {
  let { title, content, pageUrl, images, clipType = 'page', tags = [], domain } = data;

  if (!title || !title.trim()) {
    title = 'Clipped note from ' + pageUrl;
  }

  cls.init(async () => {
    const clipperInbox = getClipperInboxNote();
    const { note } = noteService.createNewNote({
      parentNoteId: clipperInbox.noteId,
      title,
      content,
      type: 'text'
    });

    note.setLabel('website', domain);
    note.setLabel('clipType', clipType);

    if (pageUrl) {
      note.setLabel('pageUrl', pageUrl);
    }

    if (tags.length > 0) {
      for (const value of tags) {
        new Attribute({
          noteId: note.noteId,
          type: 'label',
          name: 'tag',
          value
        }).save();
      }
    }

    const rewrittenContent = await processContent(images, note, content);

    note.setContent(rewrittenContent);
  });
}
