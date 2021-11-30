// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: book-open;


const df1 = new DateFormatter();
df1.dateFormat = "yyyy-MM-dd";
const fileName = df1.string(new Date());

const fm = FileManager.iCloud();
const fmLocal = FileManager.local();
const htmlSourcePath = fm.documentsDirectory() + `/html/journal.html`;
const journalsDirPath = fmLocal.documentsDirectory() + '/journals/';
const journalSourcePath = journalsDirPath + `${fileName}.txt`;

await fm.downloadFileFromiCloud(htmlSourcePath);
if (!fmLocal.isDirectory(journalsDirPath)) { fmLocal.createDirectory(journalsDirPath); }
removeLocalEmpties();
if (!fmLocal.fileExists(journalSourcePath)) {
    fmLocal.writeString(journalSourcePath, '');
}

function backUpToiCloud() {
    const icloudJournalsDirPath = fm.documentsDirectory() + '/journals/';
    const localJournalsDirPath = journalsDirPath;
    if (!fm.isDirectory(icloudJournalsDirPath)) {
        fm.createDirectory(icloudJournalsDirPath);
    }
    const localFiles = fmLocal.listContents(journalsDirPath);
    localFiles.forEach((file) => {
        let iCloudFilePath = icloudJournalsDirPath + file;
        let localFilePath = localJournalsDirPath + file;
        let content = fmLocal.readString(localFilePath);
        fm.writeString(iCloudFilePath, content);
    });
}

function removeLocalEmpties() {
    const localJournalsDirPath = journalsDirPath;
    const localFiles = fmLocal.listContents(journalsDirPath);
    localFiles.forEach((file) => {
        if (file !== fileName) {
            let localFilePath = localJournalsDirPath + file;
            let content = fmLocal.readString(localFilePath);
            if (content.trim() === '') {
                fmLocal.remove(localFilePath);
            }
        }
    });
}

const df2 = new DateFormatter();
df2.dateFormat = `
'<div class="date-header__date">'
    dd
'</div>'
'<div class="date-header__monthyearday">'
    MMM yyyy
    '<div>'
        EEEE
    '</div>'
'</div>'
`;
let htmlSource = fm.readString(htmlSourcePath);
htmlSource = htmlSource.replace('"<SCRIPTABLE_DATA>"', JSON.stringify({
    iOSVersion: Device.systemVersion(),
    content: fmLocal.readString(journalSourcePath),
    currentDate: df2.string(new Date())
}));
const wv = new WebView();
function watcher() {
    wv.evaluateJavaScript(`console.log('watcher activated...');`, true).then((res) => {
        console.log('response: ' + res);
        fmLocal.writeString(journalSourcePath, res);
        watcher();
    });
}
wv.loadHTML(htmlSource);
watcher();
wv.present(true);
backUpToiCloud();
