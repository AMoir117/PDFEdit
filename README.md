# PDF-Edit

# How to run
npm run dev

# Key
[X] - Done
[] - To Do
[... ] - In Progress
# TODO
- Drawing:
  - Save drawing canvas state when switching to another Page. [X]
  - Save drawing canvas state when switching to another Edit Mode (page arranging). [... ]
       - this should be easy now with the pngs saving in its own state array.
  - Downloads drawings for both pages. rn it mirrors the drawings of the current page. [X]
  - drawing on first page still gets erased on the first time switching to another page. [... ]
- Arrange:
  - Make sure the arranged state is saved for the other Edit Modes [... ] 
  - downloading the PDF with changes. [X]
- Edit:
  - Add edit & add text functionality. [... ]
  - Add functionality to add a form to the PDF for signing. [... ]
- Uploader:
  - Allow multiple files to be uploaded at once Then auto merge them into one PDF. [X]

- Other:
  - supress warnings on all components not just the arranger. [... ]

- Deployment:
    - get a url, im thinking pdf.edit.
    - remove those js pdf vulnerabilities.
    - add footer with a watermark.
    - use vercel, prob easiest to deploy on.

# GIFs

![Example Usage](./media/pdfedit-d2.gif)