def regex = /^(\S+) (\S+) \[(.+) -> (.+)\] \@ (\d+)$/

System.in.eachLine { line ->
    def matcher = (line =~ regex)
    if (matcher.matches()) {
        def timestamp = String.format("%,d", Long.parseLong(matcher[0][5]))
        println """
{
    "Message": "${matcher[0][1]} ${matcher[0][2]}",
    "Source Scope": "${matcher[0][3]}",
    "Target Scope": "${matcher[0][4]}",
    "Timestamp": "${timestamp}"
}
        """
    } else {
        println "No match found"
    }
}