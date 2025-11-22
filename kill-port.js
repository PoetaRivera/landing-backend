// Script para matar proceso en puerto 4001
import { exec } from 'child_process'

const PID = process.argv[2] || '25200'

console.log(`Intentando matar proceso ${PID}...`)

exec(`taskkill /PID ${PID} /F`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`)
    return
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`)
    return
  }
  console.log(`stdout: ${stdout}`)
  console.log('✅ Proceso terminado exitosamente')
})
